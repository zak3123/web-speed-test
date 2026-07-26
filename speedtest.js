const $ = (id) => document.getElementById(id);

const CF_BASE = "https://speed.cloudflare.com";
const MLAB_LOCATE = "https://locate.measurementlab.net";
const SAMPLE_MS = 250;
const GAME_PROFILES = [
  { id: "war-thunder", name: "War Thunder", type: "online vehicle combat", sizeGb: 70, mode: "online", targets: ["wt-sa", "wt-jp", "wt-na", "wt-us-east", "wt-us-west", "wt-eu", "wt-eu-frankfurt", "wt-eu-london", "wt-cis"] },
  { id: "mobile-legends", name: "Mobile Legends", type: "mobile MOBA", sizeGb: 8, mode: "competitive", targets: ["mlbb-id", "mlbb-sea", "mlbb-my", "mlbb-ph", "mlbb-th", "mlbb-vn", "mlbb-hk", "mlbb-us", "mlbb-eu"] },
  { id: "project-sekai", name: "Project Sekai", type: "rhythm co-op / ranked", sizeGb: 12, mode: "online", targets: ["pjsk-jp", "pjsk-kr", "pjsk-tw", "pjsk-sea", "pjsk-global", "pjsk-us-east", "pjsk-us-west", "pjsk-eu", "pjsk-au"] },
  { id: "arena-breakout-mobile", name: "Arena Breakout Mobile", type: "mobile extraction shooter", sizeGb: 12, mode: "competitive", targets: ["arena-apac", "arena-jpkr", "arena-india", "arena-me", "arena-na", "arena-us-east", "arena-us-west", "arena-eu", "arena-sa", "arena-oce"] },
  { id: "arena-breakout-infinite", name: "Arena Breakout Infinite", type: "PC extraction shooter", sizeGb: 60, mode: "competitive", targets: ["arena-apac", "arena-jpkr", "arena-india", "arena-me", "arena-na", "arena-us-east", "arena-us-west", "arena-eu", "arena-sa", "arena-oce"] },
  { id: "call-of-duty-mobile", name: "Call of Duty Mobile", type: "mobile FPS", sizeGb: 20, mode: "competitive", targets: ["cod-sea", "cod-hk", "cod-jp", "cod-kr", "cod-me", "cod-us", "cod-us-east", "cod-us-west", "cod-eu", "cod-br", "cod-au"] },
  { id: "call-of-duty-warzone", name: "Call of Duty / Warzone", type: "large FPS install", sizeGb: 150, mode: "competitive", targets: ["cod-sea", "cod-hk", "cod-jp", "cod-kr", "cod-me", "cod-us", "cod-us-east", "cod-us-west", "cod-eu", "cod-br", "cod-au"] },
  { id: "delta-force", name: "Delta Force", type: "PC / mobile tactical FPS", sizeGb: 60, mode: "competitive", targets: ["delta-id", "delta-sg", "delta-hk", "delta-jp", "delta-me", "delta-us-east", "delta-us-ohio", "delta-us-west", "delta-eu", "delta-eu-west", "delta-br", "delta-au"] },
  { id: "pubg-pc", name: "PUBG PC", type: "battle royale PC", sizeGb: 45, mode: "competitive", targets: ["pubg-sea", "pubg-id", "pubg-th", "pubg-hk", "pubg-krjp", "pubg-india", "pubg-me", "pubg-eu", "pubg-na", "pubg-us-east", "pubg-us-west", "pubg-sa", "pubg-oce"] },
  { id: "pubg-mobile", name: "PUBG Mobile", type: "battle royale mobile", sizeGb: 18, mode: "competitive", targets: ["pubg-sea", "pubg-id", "pubg-th", "pubg-hk", "pubg-krjp", "pubg-india", "pubg-me", "pubg-eu", "pubg-na", "pubg-us-east", "pubg-us-west", "pubg-sa", "pubg-oce"] },
  { id: "counter-strike-2", name: "Counter-Strike 2", type: "competitive FPS", sizeGb: 40, mode: "competitive", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london"] },
  { id: "dota-2", name: "Dota 2", type: "MOBA", sizeGb: 60, mode: "competitive", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london"] },
  { id: "apex-legends", name: "Apex Legends", type: "battle royale", sizeGb: 75, mode: "competitive", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-au", "steam-us-east", "steam-us-west", "steam-eu", "steam-br"] },
  { id: "gta-v", name: "GTA V", type: "large open world", sizeGb: 110, mode: "online", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london"] },
  { id: "forza-horizon-5", name: "Forza Horizon 5", type: "large racing install", sizeGb: 110, mode: "online", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london"] },
  { id: "cyberpunk-2077", name: "Cyberpunk 2077", type: "single player large install", sizeGb: 100, mode: "download", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-in", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london", "steam-br"] },
  { id: "custom", name: "Custom game", type: "custom size", sizeGb: 100, mode: "online", targets: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london"] }
];
const REGION_PRESETS = {
  selected: () => selectedGameProfile().targets || [],
  warThunder: ["wt-sa", "wt-jp", "wt-na", "wt-us-east", "wt-us-west", "wt-eu", "wt-eu-frankfurt", "wt-eu-london", "wt-cis"],
  mobile: ["mlbb-id", "mlbb-sea", "mlbb-my", "mlbb-ph", "mlbb-th", "mlbb-vn", "mlbb-hk", "pjsk-jp", "pjsk-kr", "pjsk-tw", "pjsk-sea", "arena-apac", "arena-jpkr", "cod-sea", "cod-hk", "delta-id", "delta-sg", "delta-hk", "delta-jp", "pubg-sea", "pubg-id", "pubg-th", "pubg-hk", "pubg-krjp"],
  shooters: ["arena-apac", "arena-jpkr", "arena-na", "arena-us-east", "arena-us-west", "arena-eu", "cod-sea", "cod-hk", "cod-jp", "cod-kr", "cod-us", "cod-us-east", "cod-us-west", "cod-eu", "delta-id", "delta-sg", "delta-hk", "delta-jp", "delta-eu", "delta-eu-west", "pubg-sea", "pubg-id", "pubg-th", "pubg-hk", "pubg-krjp", "pubg-eu", "pubg-na", "pubg-us-east", "pubg-us-west"],
  steam: ["steam-id", "steam-sg", "steam-hk", "steam-jp", "steam-kr", "steam-au", "steam-in", "steam-us-east", "steam-us-west", "steam-eu", "steam-eu-london", "steam-br", "steam-cloudflare"],
  all: []
};

const state = {
  running: false,
  abort: null,
  runId: 0,
  chart: [],
  engineResults: [],
  latencySamples: [],
  latestMbps: 0,
  finalResult: null,
  regionResults: []
};

function mode() {
  return $("engineMode").value;
}

function durationMs() {
  return Number($("testDuration").value || 10) * 1000;
}

function parallelStreams() {
  return Math.max(1, Math.min(12, Number($("streamCount")?.value || 6)));
}

function uploadPayloadBytes() {
  return Math.max(0, Math.min(1024 * 1024 * 1024, Number($("uploadPayload")?.value || 0)));
}

function uploadDurationMs() {
  return uploadPayloadBytes() > 0 ? Math.max(durationMs(), 20 * 60 * 1000) : durationMs();
}

function regionSamples() {
  return Math.max(2, Math.min(10, Number($("regionSamples")?.value || 4)));
}

function localApi(path) {
  return `${window.location.origin}${path}`;
}

function fmt(value, digits = 2) {
  return Number.isFinite(value) ? Number(value).toFixed(digits) : "-";
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function log(message) {
  const time = new Date().toLocaleTimeString("id-ID", { hour12: false });
  $("eventLog").innerHTML = `<div>[${time}] ${escapeHtml(message)}</div>${$("eventLog").innerHTML}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function setStatus(text, tone = "ready") {
  setText("statusText", text);
  $("statusDot").className = `status-dot ${tone}`;
}

function setPhase(text) {
  setText("phaseLabel", text);
}

function median(values) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function average(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function percentile(values, p) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!clean.length) return null;
  return clean[Math.min(clean.length - 1, Math.floor((clean.length - 1) * p))];
}

function bitsToMbps(bytes, elapsedMs) {
  return elapsedMs > 0 ? (bytes * 8) / (elapsedMs / 1000) / 1_000_000 : 0;
}

function finalTransferSpeed(samples, totalBytes, elapsedMs) {
  const averageMbps = bitsToMbps(totalBytes, elapsedMs);
  const clean = samples.filter((value) => Number.isFinite(value) && value > 0);
  if (clean.length < 4) return averageMbps;
  const warmupSamples = Math.max(1, Math.floor(clean.length * 0.18));
  const stable = clean.slice(warmupSamples);
  return percentile(stable, 0.7) ?? averageMbps;
}

function chooseCapacity(values) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  if (clean.length === 1) return clean[0];
  return metricSpread(clean) <= 20 ? median(clean) : Math.max(...clean);
}

function chooseLow(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? Math.min(...clean) : null;
}

function chooseLoss(values) {
  const clean = values.filter(Number.isFinite);
  return clean.length ? Math.max(...clean) : null;
}

function selectedGameProfile() {
  const id = $("gameProfile")?.value || "war-thunder";
  return GAME_PROFILES.find((item) => item.id === id) || GAME_PROFILES[0];
}

function selectedGameSizeGb() {
  const value = Number($("gameSize")?.value);
  return Number.isFinite(value) && value > 0 ? value : selectedGameProfile().sizeGb;
}

function applyGameProfileSize() {
  const profile = selectedGameProfile();
  if ($("gameSize")) $("gameSize").value = profile.sizeGb;
  refreshGamingFromCurrentResult();
}

function steamDownloadMBps(downloadMbps) {
  return Number.isFinite(downloadMbps) ? Math.max(0, (downloadMbps / 8) * 0.92) : null;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  if (seconds < 60) return `${Math.ceil(seconds)} detik`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}

function downloadTime(sizeGb, steamMBps) {
  return Number.isFinite(steamMBps) && steamMBps > 0 ? (sizeGb * 1000) / steamMBps : null;
}

function onlineGameGrade(result, profile) {
  const down = Number.isFinite(result.download) ? Number(result.download) : null;
  const up = Number.isFinite(result.upload) ? Number(result.upload) : null;
  const latency = Number.isFinite(result.latency) ? Number(result.latency) : null;
  const jitter = Number.isFinite(result.jitter) ? Number(result.jitter) : null;
  const loss = Number.isFinite(result.loss) ? Number(result.loss) : 0;
  if (![down, up, latency, jitter].every(Number.isFinite)) {
    return { label: "-", hint: "jalankan test dulu" };
  }
  if (profile.mode === "download") {
    return { label: "Main offline OK", hint: "internet terutama untuk download/update" };
  }
  if (loss > 2 || jitter > 30 || latency > 150) {
    return { label: "Tidak stabil", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
  }
  if (profile.mode === "competitive") {
    if (latency <= 35 && jitter <= 8 && loss <= 0.3 && down >= 15 && up >= 3) {
      return { label: "Competitive siap", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
    }
    if (latency <= 65 && jitter <= 15 && loss <= 0.8 && down >= 10 && up >= 2) {
      return { label: "Main nyaman", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
    }
    if (latency <= 100 && jitter <= 22 && loss <= 1.5) {
      return { label: "Bisa, kurang ideal", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
    }
    return { label: "Rawan delay", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
  }
  if (latency <= 60 && jitter <= 12 && loss <= 0.5 && down >= 10 && up >= 2) {
    return { label: "Main lancar", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
  }
  if (latency <= 95 && jitter <= 20 && loss <= 1.2) {
    return { label: "Main bisa", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
  }
  return { label: "Kurang stabil", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}, loss ${fmt(loss, 1)}%` };
}

function stabilityRisk(result) {
  const latency = Number.isFinite(result.latency) ? Number(result.latency) : null;
  const jitter = Number.isFinite(result.jitter) ? Number(result.jitter) : null;
  const loss = Number.isFinite(result.loss) ? Number(result.loss) : 0;
  if (![latency, jitter].every(Number.isFinite)) {
    return { label: "-", hint: "butuh latency/jitter" };
  }
  if (loss <= 0.2 && jitter <= 8 && latency <= 60) {
    return { label: "Rendah", hint: "stutter jaringan kecil" };
  }
  if (loss <= 0.8 && jitter <= 15 && latency <= 95) {
    return { label: "Sedang", hint: "masih layak untuk online" };
  }
  if (loss <= 1.5 && jitter <= 25 && latency <= 130) {
    return { label: "Tinggi", hint: "bisa terasa delay/stutter" };
  }
  return { label: "Sangat tinggi", hint: "cek Wi-Fi/router/ISP" };
}

function cloudGamingGrade(result) {
  const down = Number.isFinite(result.download) ? Number(result.download) : null;
  const latency = Number.isFinite(result.latency) ? Number(result.latency) : null;
  const jitter = Number.isFinite(result.jitter) ? Number(result.jitter) : null;
  const loss = Number.isFinite(result.loss) ? Number(result.loss) : 0;
  if (![down, latency, jitter].every(Number.isFinite)) {
    return { label: "-", hint: "butuh hasil latency" };
  }
  if (down >= 50 && latency <= 35 && jitter <= 8 && loss <= 0.5) {
    return { label: "4K / 60 siap", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}` };
  }
  if (down >= 35 && latency <= 45 && jitter <= 10 && loss <= 0.8) {
    return { label: "1440p siap", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}` };
  }
  if (down >= 20 && latency <= 60 && jitter <= 15 && loss <= 1.2) {
    return { label: "1080p siap", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}` };
  }
  if (down >= 10 && latency <= 80 && jitter <= 20 && loss <= 2) {
    return { label: "720p bisa", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}` };
  }
  return { label: "Kurang stabil", hint: `${fmt(latency, 1)} ms, jitter ${fmt(jitter, 1)}` };
}

function liveStreamGrade(uploadMbps) {
  if (!Number.isFinite(uploadMbps)) return { label: "-", hint: "butuh upload" };
  if (uploadMbps >= 35) return { label: "4K stream", hint: `${fmt(uploadMbps)} Mbps upload` };
  if (uploadMbps >= 12) return { label: "1080p60", hint: `${fmt(uploadMbps)} Mbps upload` };
  if (uploadMbps >= 7) return { label: "1080p", hint: `${fmt(uploadMbps)} Mbps upload` };
  if (uploadMbps >= 4) return { label: "720p", hint: `${fmt(uploadMbps)} Mbps upload` };
  return { label: "Kurang", hint: `${fmt(uploadMbps)} Mbps upload` };
}

function resetUi() {
  state.chart = [];
  state.engineResults = [];
  state.latencySamples = [];
  state.latestMbps = 0;
  state.finalResult = null;
  setText("mainSpeed", "0.00");
  setText("downloadSpeed", "-");
  setText("uploadSpeed", "-");
  setText("latencyAvg", "-");
  setText("jitter", "-");
  setText("packetLoss", "-");
  setText("throughput", "-");
  setText("selectedServer", "-");
  setText("serverIp", "-");
  $("engineRows").innerHTML = `<tr><td colspan="5">Test sedang disiapkan.</td></tr>`;
  $("confidenceBox").className = "confidence";
  setText("confidenceLabel", "Confidence -");
  setText("confidenceText", "Menunggu hasil lintas engine.");
  resetGaming();
  resetRegions(false);
  drawGauge(0);
  drawChart();
}

function updateMetrics(result) {
  state.finalResult = result;
  setText("downloadSpeed", fmt(result.download));
  setText("uploadSpeed", fmt(result.upload));
  setText("latencyAvg", fmt(result.latency, 1));
  setText("jitter", fmt(result.jitter, 1));
  setText("packetLoss", Number.isFinite(result.loss) ? fmt(result.loss, 1) : "-");
  setText("throughput", fmt(result.download));
  if (Number.isFinite(result.download)) setLiveMbps(result.download);
  updateGaming(result);
}

function resetGaming() {
  const profile = selectedGameProfile();
  const sizeGb = selectedGameSizeGb();
  setText("steamSpeed", "-");
  setText("game50", "-");
  setText("game100", "-");
  setText("cloudGaming", "-");
  setText("cloudGamingHint", "latency + jitter");
  setText("liveStream", "-");
  setText("liveStreamHint", "upload quality");
  setText("selectedGameName", profile.name);
  setText("selectedGameType", profile.type);
  setText("selectedGameTime", "-");
  setText("selectedGameSize", `${fmt(sizeGb, 0)} GB editable`);
  setText("onlinePlayGrade", "-");
  setText("onlinePlayHint", "latency + jitter + loss");
  setText("stabilityRisk", "-");
  setText("stabilityHint", "packet loss / jitter");
  setText("gameBadge", "Waiting");
  $("downloadRows").innerHTML = `<tr><td colspan="3">Belum ada hasil.</td></tr>`;
}

function updateGaming(result) {
  const down = Number.isFinite(result.download) ? Number(result.download) : null;
  const up = Number.isFinite(result.upload) ? Number(result.upload) : null;
  const steamMBps = steamDownloadMBps(down);
  const profile = selectedGameProfile();
  const sizeGb = selectedGameSizeGb();
  const cloud = cloudGamingGrade(result);
  const live = liveStreamGrade(up);
  const online = onlineGameGrade(result, profile);
  const risk = stabilityRisk(result);

  setText("steamSpeed", Number.isFinite(steamMBps) ? fmt(steamMBps, 1) : "-");
  setText("game50", formatDuration(downloadTime(50, steamMBps)));
  setText("game100", formatDuration(downloadTime(100, steamMBps)));
  setText("selectedGameName", profile.name);
  setText("selectedGameType", profile.type);
  setText("selectedGameTime", formatDuration(downloadTime(sizeGb, steamMBps)));
  setText("selectedGameSize", `${fmt(sizeGb, 0)} GB editable`);
  setText("onlinePlayGrade", online.label);
  setText("onlinePlayHint", online.hint);
  setText("stabilityRisk", risk.label);
  setText("stabilityHint", risk.hint);
  setText("cloudGaming", cloud.label);
  setText("cloudGamingHint", cloud.hint);
  setText("liveStream", live.label);
  setText("liveStreamHint", live.hint);
  setText("gameBadge", `${fmt(down, 0)} down / ${fmt(up, 0)} up`);

  $("downloadRows").innerHTML = GAME_PROFILES.filter((item) => item.id !== "custom").map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.sizeGb} GB est.</td>
      <td>${formatDuration(downloadTime(item.sizeGb, steamMBps))}</td>
    </tr>
  `).join("");
}

function refreshGamingFromCurrentResult() {
  if (state.finalResult) updateGaming(state.finalResult);
  else resetGaming();
}

function resetRegions(forceRows = true) {
  setText("bestWtRegion", "-");
  setText("bestWtHint", "cek region dulu");
  setText("bestSteamRegion", "-");
  setText("bestSteamHint", "cek region dulu");
  setText("overallRoute", "-");
  setText("overallRouteHint", "latency / jitter / loss");
  if (forceRows || !state.regionResults.length) {
    $("regionRows").innerHTML = `<tr><td colspan="6">Klik Check Regions untuk cek target game/region yang dipilih.</td></tr>`;
  }
}

function routeVerdict(row) {
  const latency = Number(row.avgMs);
  const jitter = Number(row.jitterMs);
  const loss = Number.isFinite(row.loss) ? Number(row.loss) : 0;
  if (![latency, jitter].every(Number.isFinite)) {
    return { label: "Gagal cek", hint: "target tidak merespons" };
  }
  if (loss > 2 || jitter > 30 || latency > 180) {
    return { label: "Buruk", hint: "rawan delay/stutter" };
  }
  if (latency <= 60 && jitter <= 10 && loss <= 0.5) {
    return { label: "Bagus", hint: "nyaman untuk online" };
  }
  if (latency <= 100 && jitter <= 18 && loss <= 1) {
    return { label: "Main bisa", hint: "cukup untuk casual" };
  }
  if (latency <= 150 && jitter <= 25 && loss <= 1.5) {
    return { label: "Ping tinggi", hint: "kurang ideal competitive" };
  }
  return { label: "Kurang", hint: "pilih region lain" };
}

function regionScore(row) {
  const latency = Number.isFinite(row.avgMs) ? row.avgMs : 9999;
  const jitter = Number.isFinite(row.jitterMs) ? row.jitterMs : 1000;
  const loss = Number.isFinite(row.loss) ? row.loss : 100;
  return latency + jitter * 2 + loss * 40;
}

function bestRegion(rows, group) {
  const filtered = rows.filter((row) => row.group === group && Number.isFinite(row.avgMs));
  return filtered.sort((a, b) => regionScore(a) - regionScore(b))[0] || null;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function selectedRegionTargetIds() {
  const preset = $("regionPreset")?.value || "selected";
  const value = REGION_PRESETS[preset];
  if (typeof value === "function") return uniqueValues(value());
  if (Array.isArray(value)) return uniqueValues(value);
  return [];
}

function renderRegionRows(rows) {
  if (!rows.length) {
    $("regionRows").innerHTML = `<tr><td colspan="6">Tidak ada hasil region.</td></tr>`;
    return;
  }
  $("regionRows").innerHTML = rows
    .slice()
    .sort((a, b) => regionScore(a) - regionScore(b))
    .map((row) => {
      const verdict = routeVerdict(row);
      return `
        <tr>
          <td><strong>${escapeHtml(row.label)}</strong><br><small>${escapeHtml(row.note || "")}</small></td>
          <td>${escapeHtml(row.region || "-")}<br><small>${escapeHtml(row.bestHost || "-")}</small></td>
          <td>${fmt(row.avgMs, 1)} ms<br><small>best ${fmt(row.bestMs, 1)} ms</small></td>
          <td>${fmt(row.jitterMs, 1)} ms</td>
          <td>${Number.isFinite(row.loss) ? fmt(row.loss, 1) : "-"}%</td>
          <td><strong>${escapeHtml(verdict.label)}</strong><br><small>${escapeHtml(verdict.hint)}</small></td>
        </tr>
      `;
    }).join("");
}

function updateRegionSummary(rows) {
  const selectedIds = new Set(selectedRegionTargetIds());
  const selectedRows = rows.filter((row) => selectedIds.size ? selectedIds.has(row.id) : row.group !== "Steam/CDN");
  const game = selectedRows.filter((row) => row.group !== "Steam/CDN" && Number.isFinite(row.avgMs)).sort((a, b) => regionScore(a) - regionScore(b))[0] || null;
  const steam = bestRegion(rows, "Steam/CDN");
  const overall = rows.filter((row) => Number.isFinite(row.avgMs)).sort((a, b) => regionScore(a) - regionScore(b))[0] || null;
  const overallVerdict = overall ? routeVerdict(overall) : null;

  setText("bestWtRegion", game ? game.label : "-");
  setText("bestWtHint", game ? `${fmt(game.avgMs, 1)} ms, jitter ${fmt(game.jitterMs, 1)}, loss ${fmt(game.loss, 1)}%` : "tidak ada hasil game");
  setText("bestSteamRegion", steam ? steam.label.replace("Steam/CDN ", "").replace("Steam CDN ", "") : "-");
  setText("bestSteamHint", steam ? `${fmt(steam.avgMs, 1)} ms via ${steam.bestHost}` : "tidak ada hasil");
  setText("overallRoute", overallVerdict ? overallVerdict.label : "-");
  setText("overallRouteHint", overall ? `${overall.label}: ${fmt(overall.avgMs, 1)} ms` : "tidak ada hasil");
}

async function runRegionProbe() {
  const button = $("regionBtn");
  button.disabled = true;
  setText("overallRoute", "Checking");
  setText("overallRouteHint", "mengukur TCP connect region");
  $("regionRows").innerHTML = `<tr><td colspan="6">Sedang cek rute region. Tunggu beberapa detik.</td></tr>`;
  try {
    const ids = selectedRegionTargetIds();
    const params = new URLSearchParams({ samples: String(regionSamples()), t: String(Date.now()) });
    if (ids.length) params.set("ids", ids.join(","));
    const response = await fetch(localApi(`/api/region-probe?${params.toString()}`), { cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body.ok) throw new Error(body.error || `HTTP ${response.status}`);
    state.regionResults = body.results || [];
    renderRegionRows(state.regionResults);
    updateRegionSummary(state.regionResults);
    log("Region server selesai dicek");
  } catch (error) {
    $("regionRows").innerHTML = `<tr><td colspan="6">Region check gagal: ${escapeHtml(error.message || "unknown error")}</td></tr>`;
    setText("overallRoute", "Error");
    setText("overallRouteHint", error.message || "region check gagal");
    log(`Region check gagal: ${error.message || "unknown error"}`);
  } finally {
    button.disabled = false;
  }
}

function setLiveMbps(value) {
  if (!Number.isFinite(value)) return;
  state.latestMbps = value;
  setText("mainSpeed", fmt(value));
  drawGauge(value);
}

function pushChart(value, phase, engine) {
  if (!Number.isFinite(value) || value < 0) return;
  state.chart.push({ value, phase, engine });
  if (state.chart.length > 180) state.chart.shift();
  drawChart();
}

function recordTransfer(bytes, elapsedMs, phase, engine) {
  if (bytes <= 0 || elapsedMs <= 0) return;
  const mbps = bitsToMbps(bytes, elapsedMs);
  pushChart(mbps, phase, engine);
  setLiveMbps(mbps);
  if (phase === "download") setText("downloadSpeed", fmt(mbps));
  if (phase === "upload") setText("uploadSpeed", fmt(mbps));
  return mbps;
}

function addLatency(ms) {
  if (!Number.isFinite(ms) || ms <= 0 || ms > 10000) return;
  state.latencySamples.push(ms);
  const avg = average(state.latencySamples);
  const diffs = state.latencySamples.slice(1).map((value, index) => Math.abs(value - state.latencySamples[index]));
  setText("latencyAvg", fmt(avg, 1));
  setText("jitter", fmt(average(diffs), 1));
}

async function timedFetch(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const external = options.signal;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const abort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", abort, { once: true });
  }
  const { signal, ...rest } = options;
  void signal;
  const started = performance.now();
  try {
    const response = await fetch(url, { cache: "no-store", ...rest, signal: controller.signal });
    return { response, elapsed: performance.now() - started };
  } finally {
    clearTimeout(timeout);
    if (external) external.removeEventListener("abort", abort);
  }
}

async function publicTrace() {
  try {
    const response = await fetch(localApi(`/api/public-trace?t=${Date.now()}`), { cache: "no-store" });
    const body = await response.json();
    if (body?.trace?.ip) return body.trace;
  } catch {}

  try {
    const { response } = await timedFetch(`${CF_BASE}/cdn-cgi/trace?t=${Date.now()}`, {}, 5000);
    const text = await response.text();
    return Object.fromEntries(text.trim().split(/\n+/).map((line) => {
      const index = line.indexOf("=");
      return index === -1 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)];
    }));
  } catch {
    return {};
  }
}

async function resolveHost(host) {
  try {
    const response = await fetch(localApi(`/api/resolve?host=${encodeURIComponent(host)}&t=${Date.now()}`));
    const body = await response.json();
    return Array.isArray(body.addresses) ? body.addresses.map((item) => item.address) : [];
  } catch {
    return [];
  }
}

async function initInfo() {
  const [trace, info] = await Promise.all([publicTrace(), localInfo()]);
  setText("clientIp", trace.ip || "-");
  setText("lanUrl", lanUrls(info));
  updateModeLabel();
}

async function localInfo() {
  try {
    const response = await fetch(localApi(`/api/info?t=${Date.now()}`), { cache: "no-store" });
    return await response.json();
  } catch {
    return {};
  }
}

function lanUrls(info) {
  const port = window.location.port || "9090";
  const addresses = Array.isArray(info?.serverIps) ? info.serverIps.map((item) => item.address) : [];
  const urls = addresses
    .filter((address) => address && !address.startsWith("127."))
    .map((address) => `http://${address}:${port}/`);
  return urls.length ? urls.join("  ") : "-";
}

function updateModeLabel() {
  const labels = {
    cloudflare: "Cloudflare multi-stream utama",
    verified: "Compare: M-Lab + Cloudflare",
    ndt7: "M-Lab NDT7 only",
    local: "Local server diagnostic"
  };
  setText("modeLabel", labels[mode()] || mode());
}

async function startTest() {
  if (state.running) return;
  const runId = ++state.runId;
  state.running = true;
  state.abort = new AbortController();
  resetUi();
  updateModeLabel();
  setStatus("Testing", "busy");
  setPhase("Starting");
  $("startBtn").disabled = true;
  $("stopBtn").disabled = false;
  $("engineBadge").textContent = mode();
  log("Test dimulai");

  try {
    let results = [];
    if (mode() === "verified") {
      results.push(await runNdt7(runId, state.abort.signal));
      if (runId !== state.runId) return;
      results.push(await runCloudflare(runId, state.abort.signal));
    } else if (mode() === "ndt7") {
      results.push(await runNdt7(runId, state.abort.signal));
    } else if (mode() === "cloudflare") {
      results.push(await runCloudflare(runId, state.abort.signal));
    } else {
      results.push(await runLocal(runId, state.abort.signal));
    }

    const final = aggregateResults(results);
    updateMetrics(final);
    renderEngineRows(results);
    updateConfidence(results, final);
    setPhase("Selesai");
    setStatus("Test complete", "ready");
    log(`Final capacity: download ${fmt(final.download)} Mbps, upload ${fmt(final.upload)} Mbps`);
  } catch (error) {
    const stopped = state.abort?.signal.aborted || error.message === "Test dihentikan";
    setPhase(stopped ? "Dihentikan" : "Error");
    setStatus(stopped ? "Stopped" : "Error", stopped ? "ready" : "error");
    log(error.message || "Test gagal");
  } finally {
    state.running = false;
    $("startBtn").disabled = false;
    $("stopBtn").disabled = true;
  }
}

function stopTest() {
  if (!state.running) return;
  state.runId += 1;
  if (state.abort) state.abort.abort();
  setStatus("Stopping", "busy");
  log("Stop diminta");
}

function aggregateResults(results) {
  return {
    name: "Final capacity",
    download: chooseCapacity(results.map((item) => item.download)),
    upload: chooseCapacity(results.map((item) => item.upload)),
    latency: chooseLow(results.map((item) => item.latency)),
    jitter: chooseLow(results.map((item) => item.jitter)),
    loss: chooseLoss(results.map((item) => item.loss)),
    server: results.map((item) => item.server).filter(Boolean).join(" + ")
  };
}

function renderEngineRows(results) {
  $("engineRows").innerHTML = results.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${fmt(item.download)} Mbps</td>
      <td>${fmt(item.upload)} Mbps</td>
      <td>${fmt(item.latency, 1)} ms</td>
      <td>${escapeHtml(item.server || "-")}</td>
    </tr>
  `).join("");
}

function updateConfidence(results, final) {
  const box = $("confidenceBox");
  const downloadValues = results.map((item) => item.download).filter(Number.isFinite);
  const uploadValues = results.map((item) => item.upload).filter(Number.isFinite);
  const downloadSpread = metricSpread(downloadValues);
  const uploadSpread = metricSpread(uploadValues);
  const downloadStable = downloadSpread <= 20;
  const uploadStable = uploadSpread <= 20;
  box.className = "confidence";
  if (results.length < 2) {
    if (mode() === "cloudflare") {
      box.classList.add("good");
      setText("confidenceLabel", "CDN capacity");
      setText("confidenceText", "Hasil utama memakai Cloudflare multi-stream, cocok untuk estimasi Steam/CDN dan pembanding Fast/Ookla.");
    } else {
      box.classList.add("warn");
      setText("confidenceLabel", "Confidence single-engine");
      setText("confidenceText", "Hasil valid untuk engine ini, tapi belum dibandingkan lintas server.");
    }
  } else if (downloadValues.length < 2 || uploadValues.length < 2) {
    box.classList.add("warn");
    setText("confidenceLabel", "Confidence partial");
    setText("confidenceText", "Sebagian metrik tidak lengkap dari salah satu engine, jadi hasil final memakai metrik yang tersedia.");
  } else if (downloadStable && uploadStable) {
    box.classList.add("good");
    setText("confidenceLabel", "Confidence high");
    setText("confidenceText", `M-Lab dan Cloudflare relatif dekat. Download spread ${fmt(downloadSpread, 0)}%, upload spread ${fmt(uploadSpread, 0)}%.`);
  } else if (downloadStable || uploadStable) {
    box.classList.add("warn");
    setText("confidenceLabel", "Confidence mixed");
    setText("confidenceText", `Download spread ${fmt(downloadSpread, 0)}%, upload spread ${fmt(uploadSpread, 0)}%. Final speed memakai kapasitas tertinggi stabil saat satu route bottleneck.`);
  } else if (downloadSpread <= 45 && uploadSpread <= 45) {
    box.classList.add("warn");
    setText("confidenceLabel", "Confidence medium");
    setText("confidenceText", `Routing antar server berbeda sedang. Download spread ${fmt(downloadSpread, 0)}%, upload spread ${fmt(uploadSpread, 0)}%.`);
  } else {
    box.classList.add("bad");
    setText("confidenceLabel", "Confidence route-limited");
    setText("confidenceText", `Download dan upload berbeda besar antar server. Coba 8 stream atau Cloudflare only untuk target seperti Fast/Ookla.`);
  }
  if (final.server) setText("selectedServer", final.server);
}

function metricSpread(values) {
  const clean = values.filter(Number.isFinite);
  if (clean.length < 2) return 0;
  const base = median(clean);
  if (!base) return 0;
  return Math.max(...clean.map((value) => Math.abs(value - base) / base)) * 100;
}

async function runNdt7(runId, signal) {
  if (!window.ndt7) throw new Error("NDT7 library belum termuat");
  setPhase("M-Lab discovery");
  log("M-Lab NDT7: mencari server terdekat");

  const result = {
    name: "M-Lab NDT7",
    download: null,
    upload: null,
    latency: null,
    jitter: null,
    loss: null,
    server: "",
    serverIp: ""
  };
  const latencies = [];

  const config = {
    userAcceptedDataPolicy: true,
    metadata: {
      client_name: "codex-accurate-speedtest",
      client_version: "2.0.0"
    },
    downloadworkerfile: "ndt7-download-worker.js",
    uploadworkerfile: "ndt7-upload-worker.js"
  };

  const callbacks = {
    error: (message) => {
      throw new Error(String(message || "NDT7 gagal"));
    },
    serverChosen: (choice) => {
      if (runId !== state.runId) return;
      result.server = ndtServerHost(choice);
      setText("selectedServer", result.server);
      log(`M-Lab server: ${result.server}`);
      resolveHost(result.server).then((addresses) => {
        if (runId !== state.runId) return;
        result.serverIp = addresses.join(", ");
        setText("serverIp", result.serverIp || "-");
      });
    },
    downloadStart: () => {
      if (runId !== state.runId) return;
      setPhase("M-Lab download");
      log("M-Lab download dimulai");
    },
    downloadMeasurement: (event) => {
      if (runId !== state.runId) return;
      handleNdtMeasurement(event, "download", result, latencies);
    },
    downloadComplete: (event) => {
      if (runId !== state.runId) return;
      result.download = ndtMbps(event?.LastClientMeasurement) ?? result.download;
      log(`M-Lab download selesai: ${fmt(result.download)} Mbps`);
    },
    uploadStart: () => {
      if (runId !== state.runId) return;
      setPhase("M-Lab upload");
      log("M-Lab upload dimulai");
    },
    uploadMeasurement: (event) => {
      if (runId !== state.runId) return;
      handleNdtMeasurement(event, "upload", result, latencies);
    },
    uploadComplete: (event) => {
      if (runId !== state.runId) return;
      result.upload = ndtMbps(event?.LastClientMeasurement) ?? result.upload;
      log(`M-Lab upload selesai: ${fmt(result.upload)} Mbps`);
    }
  };

  const code = await Promise.race([
    window.ndt7.test(config, callbacks),
    abortPromise(signal)
  ]);
  if (signal.aborted) throw new Error("Test dihentikan");
  if (code !== 0) throw new Error(`NDT7 selesai dengan kode ${code}`);

  result.latency = average(latencies);
  result.jitter = average(latencies.slice(1).map((value, index) => Math.abs(value - latencies[index])));
  state.engineResults.push(result);
  renderEngineRows(state.engineResults);
  return result;
}

function ndtServerHost(choice) {
  const urls = choice?.urls || {};
  const url = Object.values(urls).find((value) => typeof value === "string" && value.startsWith("wss://"));
  if (url) {
    try {
      return new URL(url).hostname;
    } catch {}
  }
  return choice?.machine || "M-Lab NDT7";
}

function ndtMbps(data) {
  return Number.isFinite(data?.MeanClientMbps) ? data.MeanClientMbps : null;
}

function tcpLatencyMs(data) {
  const tcp = data?.TCPInfo || {};
  const raw = tcp.MinRTT || tcp.RTT || tcp.SRTT || null;
  if (!Number.isFinite(raw)) return null;
  return raw > 1000 ? raw / 1000 : raw;
}

function handleNdtMeasurement(event, phase, result, latencies) {
  const data = event?.Data || {};
  if (event?.Source === "server") {
    const latency = tcpLatencyMs(data);
    if (latency !== null) {
      latencies.push(latency);
      addLatency(latency);
    }
    return;
  }
  const mbps = ndtMbps(data);
  if (mbps === null) return;
  if (phase === "download") result.download = mbps;
  if (phase === "upload") result.upload = mbps;
  pushChart(mbps, phase, "M-Lab");
  setLiveMbps(mbps);
  if (phase === "download") setText("downloadSpeed", fmt(mbps));
  if (phase === "upload") setText("uploadSpeed", fmt(mbps));
}

async function runCloudflare(runId, signal) {
  const result = {
    name: "Cloudflare",
    download: null,
    upload: null,
    latency: null,
    jitter: null,
    loss: null,
    server: "speed.cloudflare.com",
    serverIp: ""
  };
  setText("selectedServer", result.server);
  const addresses = await resolveHost(result.server);
  result.serverIp = addresses.join(", ");
  setText("serverIp", result.serverIp || "-");

  const lat = await runHttpLatency(`${CF_BASE}/cdn-cgi/trace`, signal);
  Object.assign(result, lat);
  setPhase("Cloudflare download");
  log("Cloudflare download dimulai");
  result.download = await runHttpDownload(`${CF_BASE}/__down`, "Cloudflare", signal);
  setPhase("Cloudflare upload");
  log("Cloudflare upload dimulai");
  result.upload = await runCloudflareUploadProxy(signal);
  log(`Cloudflare selesai: down ${fmt(result.download)} Mbps, up ${fmt(result.upload)} Mbps`);
  state.engineResults.push(result);
  renderEngineRows(state.engineResults);
  return result;
}

async function runLocal(runId, signal) {
  const result = {
    name: "Local diagnostic",
    download: null,
    upload: null,
    latency: null,
    jitter: null,
    loss: null,
    server: window.location.host,
    serverIp: "127.0.0.1"
  };
  setText("selectedServer", result.server);
  setText("serverIp", result.serverIp);
  const lat = await runHttpLatency(localApi("/api/ping"), signal);
  Object.assign(result, lat);
  setPhase("Local download");
  result.download = await runHttpDownload(localApi("/api/download"), "Local", signal);
  setPhase("Local upload");
  result.upload = await runBrowserUpload(localApi("/api/upload"), signal);
  state.engineResults.push(result);
  renderEngineRows(state.engineResults);
  return result;
}

async function runHttpLatency(base, signal) {
  setPhase("Latency probes");
  const total = 18;
  const samples = [];
  let lost = 0;
  for (let i = 0; i < total; i += 1) {
    if (signal.aborted) throw new Error("Test dihentikan");
    try {
      const url = base.includes("?") ? `${base}&t=${Date.now()}&seq=${i}` : `${base}?t=${Date.now()}&seq=${i}`;
      const { response, elapsed } = await timedFetch(url, { signal }, 2500);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.text();
      samples.push(elapsed);
      addLatency(elapsed);
    } catch (error) {
      if (signal.aborted) throw error;
      lost += 1;
    }
    await sleep(70, signal);
  }
  const diffs = samples.slice(1).map((value, index) => Math.abs(value - samples[index]));
  return {
    latency: average(samples),
    jitter: average(diffs),
    loss: (lost / total) * 100
  };
}

async function runHttpDownload(base, label, signal) {
  const duration = durationMs();
  const streams = parallelStreams();
  const block = 64 * 1024 * 1024;
  const started = performance.now();
  const stopAt = started + duration;
  let total = 0;
  let sample = 0;
  let last = started;
  const samples = [];
  const errors = [];

  function flush(force = false) {
    const now = performance.now();
    const elapsed = now - last;
    if (!force && elapsed < SAMPLE_MS) return;
    if (sample <= 0 || elapsed <= 0) return;
    const mbps = recordTransfer(sample, elapsed, "download", label);
    if (Number.isFinite(mbps)) samples.push(mbps);
    sample = 0;
    last = now;
  }

  async function worker(index) {
    while (!signal.aborted && performance.now() < stopAt) {
      const sep = base.includes("?") ? "&" : "?";
      const sizeParam = base.includes("__down") ? "bytes" : "size";
      const url = `${base}${sep}${sizeParam}=${block}&stream=${index}&t=${Date.now()}-${Math.random()}`;
      try {
        const response = await fetch(url, { cache: "no-store", signal });
        if (!response.ok) throw new Error(`${label} download HTTP ${response.status}`);
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
          sample += value.byteLength;
          flush(false);
          if (performance.now() >= stopAt) {
            await reader.cancel().catch(() => {});
            break;
          }
        }
      } catch (error) {
        if (!signal.aborted && performance.now() < stopAt) errors.push(error);
        break;
      }
    }
  }

  await Promise.all(Array.from({ length: streams }, (_, index) => worker(index)));
  if (errors.length && !signal.aborted) throw errors[0];
  flush(true);
  const mbps = finalTransferSpeed(samples, total, performance.now() - started);
  setText("downloadSpeed", fmt(mbps));
  return mbps;
}

async function runCloudflareUploadProxy(signal) {
  const params = new URLSearchParams({
    duration: String(uploadDurationMs()),
    sample: String(SAMPLE_MS),
    streams: String(parallelStreams()),
    bytes: String(uploadPayloadBytes()),
    t: String(Date.now())
  });
  const response = await fetch(localApi(`/api/internet/upload-stream?${params.toString()}`), {
    cache: "no-store",
    signal
  });
  if (!response.ok) throw new Error(`Cloudflare upload proxy HTTP ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final = null;
  const samples = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === "progress") {
        const mbps = recordTransfer(event.bytes, event.elapsedMs, "upload", "Cloudflare");
        if (Number.isFinite(mbps)) samples.push(mbps);
      } else if (event.type === "done") {
        final = finalTransferSpeed(samples, event.totalBytes, event.elapsedMs);
      } else if (event.type === "error") {
        throw new Error(event.error || "Cloudflare upload gagal");
      }
    }
  }
  setText("uploadSpeed", fmt(final));
  return final;
}

function runBrowserUpload(url, signal) {
  return new Promise((resolve, reject) => {
    const size = 16 * 1024 * 1024;
    const payload = new Blob([new Uint8Array(size)]);
    const started = performance.now();
    const xhr = new XMLHttpRequest();
    const abort = () => {
      xhr.abort();
      reject(new Error("Test dihentikan"));
    };
    signal.addEventListener("abort", abort, { once: true });
    let lastLoaded = 0;
    let last = started;
    xhr.upload.onprogress = (event) => {
      const now = performance.now();
      const delta = event.loaded - lastLoaded;
      lastLoaded = event.loaded;
      if (now - last >= SAMPLE_MS) {
        recordTransfer(delta, now - last, "upload", "Local");
        last = now;
      }
    };
    xhr.onload = () => {
      signal.removeEventListener("abort", abort);
      const mbps = bitsToMbps(size, performance.now() - started);
      setText("uploadSpeed", fmt(mbps));
      resolve(mbps);
    };
    xhr.onerror = () => {
      signal.removeEventListener("abort", abort);
      reject(new Error("Upload gagal"));
    };
    xhr.open("POST", url, true);
    xhr.send(payload);
  });
}

function abortPromise(signal) {
  return new Promise((_, reject) => {
    if (signal.aborted) reject(new Error("Test dihentikan"));
    signal.addEventListener("abort", () => reject(new Error("Test dihentikan")), { once: true });
  });
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("Test dihentikan"));
    }, { once: true });
  });
}

function drawGauge(value) {
  const canvas = $("gaugeCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 142;
  const start = Math.PI * .78;
  const end = Math.PI * 2.22;
  const max = gaugeMax(value);
  const pct = Math.max(0, Math.min(1, value / max));

  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = "round";
  ctx.lineWidth = 22;
  ctx.strokeStyle = "#dce7f2";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, end);
  ctx.stroke();

  const grad = ctx.createLinearGradient(70, 70, 290, 290);
  grad.addColorStop(0, "#15956b");
  grad.addColorStop(.5, "#1769e0");
  grad.addColorStop(1, "#b97900");
  ctx.strokeStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + (end - start) * pct);
  ctx.stroke();
}

function gaugeMax(value) {
  if (value <= 100) return 100;
  if (value <= 500) return 500;
  if (value <= 1000) return 1000;
  if (value <= 2500) return 2500;
  if (value <= 5000) return 5000;
  return Math.ceil(value / 5000) * 5000;
}

function drawChart() {
  const canvas = $("chartCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d9e3ee";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i += 1) {
    const y = h * i / 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  if (!state.chart.length) {
    ctx.fillStyle = "#687789";
    ctx.font = "16px Segoe UI";
    ctx.fillText("Belum ada data", 22, 42);
    return;
  }
  const max = Math.max(10, ...state.chart.map((item) => item.value)) * 1.15;
  const step = w / Math.max(1, state.chart.length - 1);
  drawSeries(ctx, "download", "#1769e0", max, step, h);
  drawSeries(ctx, "upload", "#15956b", max, step, h);
  ctx.fillStyle = "#687789";
  ctx.font = "13px Segoe UI";
  ctx.fillText(`Max ${fmt(max / 1.15, 1)} Mbps`, 18, 22);
}

function drawSeries(ctx, phase, color, max, step, h) {
  const points = state.chart
    .map((item, index) => ({ ...item, chartIndex: index, x: index * step }))
    .filter((item) => item.phase === phase);
  if (!points.length) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((point, index) => {
    const prev = points[index - 1];
    const y = h - (point.value / max) * (h - 28) - 14;
    const shouldBreak = !prev || prev.engine !== point.engine || point.chartIndex - prev.chartIndex > 1;
    if (shouldBreak) ctx.moveTo(point.x, y);
    else ctx.lineTo(point.x, y);
  });
  ctx.stroke();
}

window.addEventListener("DOMContentLoaded", () => {
  $("startBtn").addEventListener("click", startTest);
  $("stopBtn").addEventListener("click", stopTest);
  $("regionBtn").addEventListener("click", runRegionProbe);
  $("engineMode").addEventListener("change", updateModeLabel);
  $("gameProfile").addEventListener("change", applyGameProfileSize);
  $("gameSize").addEventListener("input", refreshGamingFromCurrentResult);
  resetUi();
  setStatus("Ready", "ready");
  initInfo();
});
