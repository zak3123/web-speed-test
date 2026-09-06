// Rest of server - API Handlers & Routes

async function handleInfo(req, res) {
  json(res, 200, {
    ok: true,
    hostname: os.hostname(),
    node: process.version,
    port: PORT,
    uptime: Math.round(process.uptime()),
    ips: getLocalIPs(),
    clientIp: getClientIP(req),
    public: PUBLIC_MODE ? "ON" : "LAN only"
  });
}

async function handleClientProfile(req, res) {
  if (!checkRateLimit(req, "profile", 60, 60 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  const profile = await fetchProfile(getClientIP(req));
  json(res, 200, profile);
}

function handlePing(req, res) {
  if (!checkRateLimit(req, "ping", 240, 60 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  json(res, 200, {ok: true, seq: req.url.match(/seq=(\d+)/)?.[1] || "", time: Date.now()});
}

async function handleRegionTargets(req, res) {
  json(res, 200, {ok: true, count: REGION_TARGETS.length, targets: REGION_TARGETS.map(t => ({id: t.id, label: t.label, group: t.group}))});
}

async function handleRegionProbe(req, res) {
  if (!checkRateLimit(req, "region", 20, 60 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  
  const ids = req.url.match(/ids=([^&]*)/)?.[1]?.split(",").map(s => s.trim()).filter(Boolean) || [];
  const samples = Math.max(2, Math.min(10, +req.url.match(/samples=(\d+)/)?.[1] || 4));
  
  const selected = ids.length ? REGION_TARGETS.filter(t => ids.includes(t.id)) : REGION_TARGETS;
  
  if (!selected.length) {
    return json(res, 400, {ok: false, error: "Invalid target"});
  }
  
  try {
    const results = await parallelMap(selected, 8, target => probeTarget(target, samples));
    json(res, 200, {ok: true, samples, results});
  } catch (error) {
    json(res, 500, {ok: false, error: error.message});
  }
}

async function handleResolve(req, res) {
  if (!checkRateLimit(req, "resolve", 60, 60 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  
  const host = req.url.match(/host=([^&]*)/)?.[1];
  if (!host || !/^[a-z0-9.-]{1,253}$/.test(host)) {
    return json(res, 400, {ok: false, error: "Invalid host"});
  }
  
  try {
    const addresses = await dns.lookup(host, {all: true});
    json(res, 200, {ok: true, host, addresses: addresses.map(a => a.address)});
  } catch (error) {
    json(res, 502, {ok: false, error: error.message, addresses: []});
  }
}

async function handlePublicTrace(req, res) {
  try {
    const resData = await fetch(`${CF_TRACE}?t=${Date.now()}`, {cache: "no-store"});
    const text = await resData.text();
    const trace = Object.fromEntries(text.trim().split(/\n+/).map(line => {
      const idx = line.indexOf("=");
      return idx === -1 ? [line, ""] : [line.slice(0, idx), line.slice(idx + 1)];
    }));
    json(res, 200, {ok: true, trace});
  } catch (error) {
    json(res, 502, {ok: false, error: error.message, trace: {}});
  }
}

function handleDownload(req, res) {
  if (!checkRateLimit(req, "download", 180, 60 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  
  const match = req.url.match(/[?&]size=(\d+)/);
  const totalBytes = match ? Math.min(MAX_DOWNLOAD, Math.max(1024, +match[1])) : 26843545; // 25MB default
  
  const chunk = crypto.randomBytes(65536);
  let sent = 0;
  
  res.writeHead(200, headers({"Content-Type":"application/octet-stream","Content-Length":totalBytes,"X-Speedtest-Bytes":totalBytes}));
  
  function writeMore() {
    while (sent < totalBytes) {
      const remaining = totalBytes - sent;
      const part = remaining >= chunk.length ? chunk : chunk.subarray(0, remaining);
      sent += part.length;
      if (!res.write(part)) {
        res.once("drain", writeMore);
        return;
      }
    }
    res.end();
  }
  writeMore();
}

function handleUpload(req, res) {
  if (!checkRateLimit(req, "upload", 60, 60 * 1000)) {
    res.writeHead(429, headers());
    res.end(JSON.stringify({ok:false,error:"Rate limit"}));
    req.destroy();
    return;
  }
  
  let received = 0;
  const start = process.hrtime.bigint();
  
  req.on("data", chunk => {
    received += chunk.length;
    if (received > MAX_UPLOAD) {
      res.writeHead(413, headers());
      res.end(JSON.stringify({ok:false,error:"Too large",received}));
      req.destroy();
    }
  });
  
  req.on("end", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    json(res, 200, {ok:true,receivedBytes:received,durationMs:Math.round(ms*100)/100});
  });
  
  req.on("error", () => {
    if (!res.headersSent) json(res, 500, {ok:false,error:"Upload error"});
  });
}

async function handleInternetUpload(req, res) {
  if (!checkRateLimit(req, "internet-upload", 12, 600 * 1000)) {
    return json(res, 429, {ok: false, error: "Rate limit"});
  }
  
  const ip = getClientIP(req);
  const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const bytes = Math.max(0, Math.min(MAX_UPLOAD, +params.get("bytes") || 0));
  const duration = Math.max(1000, Math.min(1200 * 1000, +params.get("duration") || 8000));
  const streams = Math.max(1, Math.min(12, +params.get("streams") || 6));
  const sampleMs = Math.max(100, Math.min(2000, +params.get("sample") || 250));
  
  const active = activeStreams.get(ip) || 0;
  if (active + streams > MAX_UPLOAD_STREAMS) {
    return json(res, 429, {ok: false, error: "Max streams exceeded"});
  }
  
  activeStreams.set(ip, active + streams);
  const chunk = Buffer.alloc(262144); // 256KB
  const started = process.hrtime.bigint();
  const stopAt = Date.now() + duration;
  let total = 0, sample = 0, firstByte = null, lastSample = 0;
  let closed = false;
  const ctrl = new AbortController();
  
  res.writeHead(200, headers({"Content-Type":"application/x-ndjson"}));
  
  req.on("aborted", () => {closed = true; ctrl.abort();});
  res.on("close", () => {closed = true; ctrl.abort();});
  
  function elapsed() {
    if (!firstByte || !lastByte) return 0;
    return Math.max(0, lastByte - firstByte);
  }
  
  function writeEvent(event) {
    if (!closed && !res.destroyed) res.write(JSON.stringify(event) + "\n");
  }
  
  function addBytes(size) {
    const now = process.hrtime.bigint();
    if (!firstByte) firstByte = now;
    lastByte = now;
    total += size;
    sample += size;
    writeProgress(false);
  }
  
  function writeProgress(force) {
    const now = process.hrtime.bigint();
    const delta = now - BigInt(lastSample * 1000000);
    if (!force && delta < BigInt(sampleMs * 1000000)) return;
    if (sample <= 0) return;
    
    const deltaMs = Number(delta) / 1e6;
    const mbps = (sample * 8) / (deltaMs / 1000) / 1e6;
    
    writeEvent({type:"progress",bytes:sample,elapsedMs:deltaMs,totalBytes:total,totalElapsed:elapsed(),mbps});
    sample = 0;
    lastSample = now / 1000000n;
  }
  
  async function* generator() {
    while (!closed && !ctrl.signal.aborted && Date.now() < stopAt && (!bytes || total < bytes)) {
      const remaining = bytes ? bytes - total : chunk.length;
      const part = remaining >= chunk.length ? chunk : chunk.subarray(0, Math.max(0, remaining));
      if (!part.length) break;
      addBytes(part.length);
      yield part;
      await new Promise(r => setImmediate(r));
    }
    writeProgress(true);
  }
  
  writeEvent({type:"start",duration,durationMs:duration,streams,requestedBytes:bytes});
  
  try {
    const promises = Array.from({length: streams}, (_, i) => 
      fetch(`${CF_UPLOAD}?stream=${i}&t=${Date.now()}`, {
        method: "POST",
        body: Readable.from(generator()),
        duplex: "half",
        signal: ctrl.signal
      }).then(r => r.text()).catch(() => {})
    );
    
    await Promise.all(promises);
    
    const finalMs = elapsed() / 1e6;
    const mbps = finalMs > 0 ? (total * 8) / (finalMs / 1000) / 1e6 : 0;
    writeEvent({type:"done",totalBytes:total,elapsedMs:finalMs,mbps});
  } catch (error) {
    ctrl.abort();
    writeEvent({type:"error",error:error.message});
  } finally {
    activeStreams.set(ip, Math.max(0, (activeStreams.get(ip) || streams) - streams));
    if (!closed && !res.destroyed) res.end();
  }
}

function serveStatic(req, res, pathname) {
  const safePath = path.resolve(ROOT, `.${decodeURIComponent(pathname === "/" ? "/speedtest.html" : pathname)}`);
  
  if (safePath !== ROOT && !safePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, headers());
    res.end("Forbidden");
    return;
  }
  
  fs.readFile(safePath, (err, data) => {
    if (err) {
      res.writeHead(404, headers());
      res.end("Not Found");
      return;
    }
    
    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, headers({...headers(), "Content-Type":MIME[ext]||"application/octet-stream","Cache-Control":"no-store"}));
    res.end(data);
  });
}

// Main HTTP server
const server = http.createServer((req, res) => {
  // URL length check
  if ((req.url || "").length > MAX_URL_LEN) {
    return json(res, 414, {ok: false, error: "URL too long"});
  }
  
  // Access control
  if (!PUBLIC_MODE && isPrivate(getClientIP(req))) {
    return json(res, 403, {ok: false, error: "LAN access only. Set SPEEDTEST_PUBLIC=1 for public"});
  }
  
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  
  if (req.method === "OPTIONS") {
    res.writeHead(204, headers());
    res.end();
    return;
  }
  
  // Route matching
  const path = url.pathname;
  const query = url.search;
  
  if (path === "/api/info" && req.method === "GET") return handleInfo(req, res);
  if (path === "/api/client-profile" && req.method === "GET") return handleClientProfile(req, res);
  if (path === "/api/ping" && req.method === "GET") return handlePing(req, res);
  if (path === "/api/region-targets" && req.method === "GET") return handleRegionTargets(req, res);
  if (path === "/api/region-probe" && req.method === "GET") return handleRegionProbe(req, res);
  if (path === "/api/public-trace" && req.method === "GET") return handlePublicTrace(req, res);
  if (path === "/api/resolve" && req.method === "GET") return handleResolve(req, res);
  if (path === "/api/download" && req.method === "GET") return handleDownload(req, res);
  if (path === "/api/upload" && req.method === "POST") return handleUpload(req, res);
  if (path === "/api/internet/upload-stream" && req.method === "GET") return handleInternetUpload(req, res);
  if (path.startsWith("/api/")) {
    return json(res, 404, {ok: false, error: "Not found"});
  }
  
  return serveStatic(req, res, url.pathname);
});

// Server settings for production
server.requestTimeout = 25 * 60 * 1000;
server.headersTimeout = 30 * 1000;
server.keepAliveTimeout = 5 * 1000;
server.maxHeadersCount = 64;

server.on("clientError", (err, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  }
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`SpeedTest v3.0 running: http://localhost:${PORT}`);
  console.log(`Bind: ${HOST}`);
  console.log(`Mode: ${PUBLIC_MODE ? "PUBLIC" : "LAN Only"}`);
  console.log(`Targets: ${REGION_TARGETS.length} regions optimized`);
});

module.exports = {server};
