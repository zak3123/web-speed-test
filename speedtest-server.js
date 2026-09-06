const crypto = require("node:crypto");
const dns = require("node:dns").promises;
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { Readable } = require("node:stream");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 9090);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_MODE = process.env.SPEEDTEST_PUBLIC === "1";
const MAX_DOWNLOAD_BYTES = 512 * 1024 * 1024; // 512MB max download chunk
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1GB max upload
const MAX_URL_LENGTH = 2048; // URL length limit
const MAX_CONCURRENT_UPLOAD_STREAMS = Math.max(1, Math.min(24, Number(process.env.SPEEDTEST_MAX_UPLOAD_STREAMS) || 12)); // Configurable streams
const INTERNET_UPLOAD_TARGET = "https://speed.cloudflare.com/__up"; // Cloudflare upload endpoint
const CLOUDFLARE_TRACE = "https://speed.cloudflare.com/cdn-cgi/trace";
const IP_PROFILE_API = "https://ipwho.is"; // Public IP/ISP info API
const rateBuckets = new Map();
const activeUploadStreams = new Map();
const profileCache = new Map();
const REGION_TARGETS = [
  {
    id: "wt-sa",
    label: "War Thunder SA / South Asia",
    group: "War Thunder",
    region: "South Asia / Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com", "speed.cloudflare.com"],
    note: "Aproksimasi South Asia/Asia; SA di War Thunder sering hanya lewat Auto."
  },
  {
    id: "wt-na",
    label: "War Thunder NA / US",
    group: "War Thunder",
    region: "North America approx",
    hosts: ["s3.us-west-2.amazonaws.com", "s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi rute ke North America."
  },
  {
    id: "wt-eu",
    label: "War Thunder EU",
    group: "War Thunder",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi rute ke Europe."
  },
  {
    id: "wt-cis",
    label: "War Thunder CIS",
    group: "War Thunder",
    region: "CIS / Russia approx",
    hosts: ["storage.yandexcloud.net", "yandex.ru"],
    note: "Aproksimasi CIS/Russia; bukan IP server Gaijin."
  },
  {
    id: "wt-us-east",
    label: "War Thunder US East",
    group: "War Thunder",
    region: "US East approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-east-2.amazonaws.com"],
    note: "Aproksimasi US East; bukan IP server Gaijin."
  },
  {
    id: "wt-us-west",
    label: "War Thunder US West",
    group: "War Thunder",
    region: "US West approx",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US West; bukan IP server Gaijin."
  },
  {
    id: "wt-eu-frankfurt",
    label: "War Thunder EU Frankfurt",
    group: "War Thunder",
    region: "Frankfurt approx",
    hosts: ["s3.eu-central-1.amazonaws.com"],
    note: "Aproksimasi EU Central; bukan IP server Gaijin."
  },
  {
    id: "wt-eu-london",
    label: "War Thunder EU London",
    group: "War Thunder",
    region: "London approx",
    hosts: ["s3.eu-west-2.amazonaws.com"],
    note: "Aproksimasi EU West; bukan IP server Gaijin."
  },
  {
    id: "wt-jp",
    label: "War Thunder Asia Japan",
    group: "War Thunder",
    region: "Japan approx",
    hosts: ["s3.ap-northeast-1.amazonaws.com"],
    note: "Pembanding rute Asia/Japan; bukan region resmi pilihan WT."
  },
  {
    id: "mlbb-id",
    label: "Mobile Legends Indonesia",
    group: "Mobile Legends",
    region: "Indonesia / Jakarta approx",
    hosts: ["s3.ap-southeast-3.amazonaws.com", "www.telkomsel.com"],
    note: "MLBB tidak punya server switch biasa; route sering mengikuti jaringan/lokasi."
  },
  {
    id: "mlbb-sea",
    label: "Mobile Legends SEA",
    group: "Mobile Legends",
    region: "Singapore / SEA approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com", "speed.cloudflare.com"],
    note: "Aproksimasi SEA untuk Indonesia/Malaysia/Singapore/Philippines."
  },
  {
    id: "mlbb-ph",
    label: "Mobile Legends Philippines",
    group: "Mobile Legends",
    region: "Philippines approx",
    hosts: ["www.globe.com.ph", "www.smart.com.ph"],
    note: "Aproksimasi route Philippines; endpoint publik bisa lewat CDN."
  },
  {
    id: "mlbb-us",
    label: "Mobile Legends NA",
    group: "Mobile Legends",
    region: "North America approx",
    hosts: ["s3.us-west-2.amazonaws.com", "s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi rute NA."
  },
  {
    id: "mlbb-eu",
    label: "Mobile Legends EU",
    group: "Mobile Legends",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi rute EU."
  },
  {
    id: "mlbb-my",
    label: "Mobile Legends Malaysia",
    group: "Mobile Legends",
    region: "Malaysia approx",
    hosts: ["www.maxis.com.my", "www.tm.com.my", "s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi Malaysia; bukan endpoint resmi MLBB."
  },
  {
    id: "mlbb-th",
    label: "Mobile Legends Thailand",
    group: "Mobile Legends",
    region: "Thailand approx",
    hosts: ["www.ais.th", "www.true.th", "s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi Thailand; endpoint publik bisa lewat CDN."
  },
  {
    id: "mlbb-vn",
    label: "Mobile Legends Vietnam",
    group: "Mobile Legends",
    region: "Vietnam approx",
    hosts: ["vietteltelecom.vn", "vnpt.com.vn", "s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi Vietnam; endpoint publik bisa lewat CDN."
  },
  {
    id: "mlbb-hk",
    label: "Mobile Legends Hong Kong",
    group: "Mobile Legends",
    region: "Hong Kong approx",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Aproksimasi Hong Kong."
  },
  {
    id: "pjsk-jp",
    label: "Project Sekai JP",
    group: "Project Sekai",
    region: "Japan / Tokyo approx",
    hosts: ["s3.ap-northeast-1.amazonaws.com"],
    note: "Aproksimasi server Jepang."
  },
  {
    id: "pjsk-kr",
    label: "Project Sekai Korea",
    group: "Project Sekai",
    region: "Korea / Seoul approx",
    hosts: ["s3.ap-northeast-2.amazonaws.com"],
    note: "Aproksimasi server Korea."
  },
  {
    id: "pjsk-tw",
    label: "Project Sekai TW/HK",
    group: "Project Sekai",
    region: "Taiwan / Hong Kong approx",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Aproksimasi Traditional Chinese region."
  },
  {
    id: "pjsk-sea",
    label: "Project Sekai SEA",
    group: "Project Sekai",
    region: "Southeast Asia / Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi rute SEA."
  },
  {
    id: "pjsk-global",
    label: "Project Sekai Global",
    group: "Project Sekai",
    region: "Global / US approx",
    hosts: ["s3.us-west-2.amazonaws.com", "s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi global/English route."
  },
  {
    id: "pjsk-us-east",
    label: "Project Sekai Global US East",
    group: "Project Sekai",
    region: "US East approx",
    hosts: ["s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi Global/US East."
  },
  {
    id: "pjsk-us-west",
    label: "Project Sekai Global US West",
    group: "Project Sekai",
    region: "US West approx",
    hosts: ["s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi Global/US West."
  },
  {
    id: "pjsk-eu",
    label: "Project Sekai Global EU",
    group: "Project Sekai",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi Global/Europe."
  },
  {
    id: "pjsk-au",
    label: "Project Sekai Global Oceania",
    group: "Project Sekai",
    region: "Australia approx",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Aproksimasi Global/Oceania."
  },
  {
    id: "arena-apac",
    label: "Arena Breakout APAC",
    group: "Arena Breakout",
    region: "APAC / Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi APAC untuk Arena Breakout Mobile/Infinite."
  },
  {
    id: "arena-na",
    label: "Arena Breakout NA",
    group: "Arena Breakout",
    region: "North America approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi NA."
  },
  {
    id: "arena-eu",
    label: "Arena Breakout EU",
    group: "Arena Breakout",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi EU."
  },
  {
    id: "arena-sa",
    label: "Arena Breakout South America",
    group: "Arena Breakout",
    region: "Brazil / Sao Paulo approx",
    hosts: ["s3.sa-east-1.amazonaws.com"],
    note: "Aproksimasi South America."
  },
  {
    id: "arena-oce",
    label: "Arena Breakout Oceania",
    group: "Arena Breakout",
    region: "Australia / Sydney approx",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Aproksimasi Oceania."
  },
  {
    id: "arena-jpkr",
    label: "Arena Breakout Japan/Korea",
    group: "Arena Breakout",
    region: "Japan / Korea approx",
    hosts: ["s3.ap-northeast-1.amazonaws.com", "s3.ap-northeast-2.amazonaws.com"],
    note: "Aproksimasi Japan/Korea."
  },
  {
    id: "arena-india",
    label: "Arena Breakout India",
    group: "Arena Breakout",
    region: "India / Mumbai approx",
    hosts: ["s3.ap-south-1.amazonaws.com"],
    note: "Aproksimasi India."
  },
  {
    id: "arena-me",
    label: "Arena Breakout Middle East",
    group: "Arena Breakout",
    region: "Middle East approx",
    hosts: ["s3.me-south-1.amazonaws.com", "s3.me-central-1.amazonaws.com"],
    note: "Aproksimasi Middle East."
  },
  {
    id: "arena-us-east",
    label: "Arena Breakout US East",
    group: "Arena Breakout",
    region: "US East approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-east-2.amazonaws.com"],
    note: "Aproksimasi US East."
  },
  {
    id: "arena-us-west",
    label: "Arena Breakout US West",
    group: "Arena Breakout",
    region: "US West approx",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US West."
  },
  {
    id: "cod-sea",
    label: "Call of Duty SEA",
    group: "Call of Duty",
    region: "Southeast Asia / Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi COD Mobile/Warzone SEA."
  },
  {
    id: "cod-jp",
    label: "Call of Duty Japan",
    group: "Call of Duty",
    region: "Japan / Tokyo approx",
    hosts: ["s3.ap-northeast-1.amazonaws.com"],
    note: "Aproksimasi Japan."
  },
  {
    id: "cod-us",
    label: "Call of Duty US",
    group: "Call of Duty",
    region: "US East/West approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US."
  },
  {
    id: "cod-eu",
    label: "Call of Duty EU",
    group: "Call of Duty",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi Europe."
  },
  {
    id: "cod-au",
    label: "Call of Duty Oceania",
    group: "Call of Duty",
    region: "Australia / Sydney approx",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Aproksimasi Oceania."
  },
  {
    id: "cod-hk",
    label: "Call of Duty Hong Kong",
    group: "Call of Duty",
    region: "Hong Kong approx",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Aproksimasi Hong Kong."
  },
  {
    id: "cod-kr",
    label: "Call of Duty Korea",
    group: "Call of Duty",
    region: "Korea / Seoul approx",
    hosts: ["s3.ap-northeast-2.amazonaws.com"],
    note: "Aproksimasi Korea."
  },
  {
    id: "cod-us-east",
    label: "Call of Duty US East",
    group: "Call of Duty",
    region: "US East approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-east-2.amazonaws.com"],
    note: "Aproksimasi US East."
  },
  {
    id: "cod-us-west",
    label: "Call of Duty US West",
    group: "Call of Duty",
    region: "US West approx",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US West."
  },
  {
    id: "cod-me",
    label: "Call of Duty Middle East",
    group: "Call of Duty",
    region: "Middle East approx",
    hosts: ["s3.me-south-1.amazonaws.com", "s3.me-central-1.amazonaws.com"],
    note: "Aproksimasi Middle East."
  },
  {
    id: "cod-br",
    label: "Call of Duty South America",
    group: "Call of Duty",
    region: "Brazil / Sao Paulo approx",
    hosts: ["s3.sa-east-1.amazonaws.com"],
    note: "Aproksimasi South America."
  },
  {
    id: "delta-id",
    label: "Delta Force Indonesia",
    group: "Delta Force",
    region: "Indonesia / Jakarta approx",
    hosts: ["s3.ap-southeast-3.amazonaws.com"],
    note: "Aproksimasi Indonesia; Delta Force Mobile punya beberapa region Asia."
  },
  {
    id: "delta-sg",
    label: "Delta Force Singapore",
    group: "Delta Force",
    region: "Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi Singapore."
  },
  {
    id: "delta-jp",
    label: "Delta Force Japan",
    group: "Delta Force",
    region: "Japan / Tokyo approx",
    hosts: ["s3.ap-northeast-1.amazonaws.com"],
    note: "Aproksimasi Japan."
  },
  {
    id: "delta-me",
    label: "Delta Force Saudi / Middle East",
    group: "Delta Force",
    region: "Middle East / Bahrain approx",
    hosts: ["s3.me-south-1.amazonaws.com"],
    note: "Aproksimasi Saudi/Middle East."
  },
  {
    id: "delta-us-east",
    label: "Delta Force US East",
    group: "Delta Force",
    region: "Virginia / US East approx",
    hosts: ["s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi US East."
  },
  {
    id: "delta-us-west",
    label: "Delta Force US West",
    group: "Delta Force",
    region: "California/Oregon / US West approx",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US West."
  },
  {
    id: "delta-eu",
    label: "Delta Force Europe",
    group: "Delta Force",
    region: "Frankfurt / Nordic approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-north-1.amazonaws.com"],
    note: "Aproksimasi Europe."
  },
  {
    id: "delta-br",
    label: "Delta Force South America",
    group: "Delta Force",
    region: "Brazil / Sao Paulo approx",
    hosts: ["s3.sa-east-1.amazonaws.com"],
    note: "Aproksimasi South America."
  },
  {
    id: "delta-au",
    label: "Delta Force Oceania",
    group: "Delta Force",
    region: "Australia / Sydney approx",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Aproksimasi Oceania."
  },
  {
    id: "delta-us-ohio",
    label: "Delta Force US Central/East",
    group: "Delta Force",
    region: "Ohio / US Central-East approx",
    hosts: ["s3.us-east-2.amazonaws.com"],
    note: "Aproksimasi tambahan US Central-East."
  },
  {
    id: "delta-eu-west",
    label: "Delta Force EU West",
    group: "Delta Force",
    region: "London / Ireland approx",
    hosts: ["s3.eu-west-2.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi tambahan EU West."
  },
  {
    id: "delta-hk",
    label: "Delta Force Hong Kong",
    group: "Delta Force",
    region: "Hong Kong approx",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Aproksimasi Hong Kong/Asia gateway."
  },
  {
    id: "pubg-sea",
    label: "PUBG SEA",
    group: "PUBG",
    region: "Southeast Asia / Singapore approx",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi PUBG PC/Mobile SEA."
  },
  {
    id: "pubg-id",
    label: "PUBG Indonesia",
    group: "PUBG",
    region: "Indonesia / Jakarta approx",
    hosts: ["s3.ap-southeast-3.amazonaws.com"],
    note: "Aproksimasi Indonesia."
  },
  {
    id: "pubg-krjp",
    label: "PUBG KR/JP",
    group: "PUBG",
    region: "Korea / Japan approx",
    hosts: ["s3.ap-northeast-2.amazonaws.com", "s3.ap-northeast-1.amazonaws.com"],
    note: "Aproksimasi Korea/Japan."
  },
  {
    id: "pubg-india",
    label: "PUBG India",
    group: "PUBG",
    region: "India / Mumbai approx",
    hosts: ["s3.ap-south-1.amazonaws.com"],
    note: "Aproksimasi India."
  },
  {
    id: "pubg-me",
    label: "PUBG Middle East",
    group: "PUBG",
    region: "Middle East / Bahrain approx",
    hosts: ["s3.me-south-1.amazonaws.com"],
    note: "Aproksimasi Middle East."
  },
  {
    id: "pubg-eu",
    label: "PUBG EU",
    group: "PUBG",
    region: "Europe approx",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Aproksimasi Europe."
  },
  {
    id: "pubg-na",
    label: "PUBG NA",
    group: "PUBG",
    region: "North America approx",
    hosts: ["s3.us-west-2.amazonaws.com", "s3.us-east-1.amazonaws.com"],
    note: "Aproksimasi North America."
  },
  {
    id: "pubg-oce",
    label: "PUBG Oceania",
    group: "PUBG",
    region: "Australia / Sydney approx",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Aproksimasi Oceania."
  },
  {
    id: "pubg-th",
    label: "PUBG Thailand",
    group: "PUBG",
    region: "Thailand approx",
    hosts: ["www.ais.th", "www.true.th", "s3.ap-southeast-1.amazonaws.com"],
    note: "Aproksimasi Thailand."
  },
  {
    id: "pubg-hk",
    label: "PUBG Hong Kong",
    group: "PUBG",
    region: "Hong Kong approx",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Aproksimasi Hong Kong."
  },
  {
    id: "pubg-us-east",
    label: "PUBG US East",
    group: "PUBG",
    region: "US East approx",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-east-2.amazonaws.com"],
    note: "Aproksimasi US East."
  },
  {
    id: "pubg-us-west",
    label: "PUBG US West",
    group: "PUBG",
    region: "US West approx",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Aproksimasi US West."
  },
  {
    id: "pubg-sa",
    label: "PUBG South America",
    group: "PUBG",
    region: "Brazil / Sao Paulo approx",
    hosts: ["s3.sa-east-1.amazonaws.com"],
    note: "Aproksimasi South America."
  },
  {
    id: "steam-sg",
    label: "Steam CDN Singapore",
    group: "Steam/CDN",
    region: "Singapore",
    hosts: ["s3.ap-southeast-1.amazonaws.com"],
    note: "Estimasi rute CDN Asia Tenggara."
  },
  {
    id: "steam-jp",
    label: "Steam CDN Japan",
    group: "Steam/CDN",
    region: "Tokyo",
    hosts: ["s3.ap-northeast-1.amazonaws.com"],
    note: "Estimasi rute Jepang."
  },
  {
    id: "steam-au",
    label: "Steam CDN Australia",
    group: "Steam/CDN",
    region: "Sydney",
    hosts: ["s3.ap-southeast-2.amazonaws.com"],
    note: "Estimasi rute Australia."
  },
  {
    id: "steam-us",
    label: "Steam/CDN US",
    group: "Steam/CDN",
    region: "US East/West",
    hosts: ["s3.us-west-2.amazonaws.com", "s3.us-east-1.amazonaws.com"],
    note: "Estimasi rute CDN Amerika."
  },
  {
    id: "steam-eu",
    label: "Steam/CDN EU",
    group: "Steam/CDN",
    region: "Frankfurt / Ireland",
    hosts: ["s3.eu-central-1.amazonaws.com", "s3.eu-west-1.amazonaws.com"],
    note: "Estimasi rute CDN Eropa."
  },
  {
    id: "steam-id",
    label: "Steam CDN Indonesia",
    group: "Steam/CDN",
    region: "Jakarta approx",
    hosts: ["s3.ap-southeast-3.amazonaws.com", "speed.cloudflare.com"],
    note: "Estimasi rute download CDN Indonesia/Jakarta."
  },
  {
    id: "steam-hk",
    label: "Steam CDN Hong Kong",
    group: "Steam/CDN",
    region: "Hong Kong",
    hosts: ["s3.ap-east-1.amazonaws.com"],
    note: "Estimasi rute Hong Kong."
  },
  {
    id: "steam-kr",
    label: "Steam CDN Korea",
    group: "Steam/CDN",
    region: "Seoul",
    hosts: ["s3.ap-northeast-2.amazonaws.com"],
    note: "Estimasi rute Korea."
  },
  {
    id: "steam-in",
    label: "Steam CDN India",
    group: "Steam/CDN",
    region: "Mumbai / Hyderabad",
    hosts: ["s3.ap-south-1.amazonaws.com", "s3.ap-south-2.amazonaws.com"],
    note: "Estimasi rute India."
  },
  {
    id: "steam-br",
    label: "Steam CDN Brazil",
    group: "Steam/CDN",
    region: "Sao Paulo",
    hosts: ["s3.sa-east-1.amazonaws.com"],
    note: "Estimasi rute Brazil."
  },
  {
    id: "steam-eu-london",
    label: "Steam CDN London",
    group: "Steam/CDN",
    region: "London",
    hosts: ["s3.eu-west-2.amazonaws.com"],
    note: "Estimasi rute London."
  },
  {
    id: "steam-us-east",
    label: "Steam CDN US East",
    group: "Steam/CDN",
    region: "Virginia / Ohio",
    hosts: ["s3.us-east-1.amazonaws.com", "s3.us-east-2.amazonaws.com"],
    note: "Estimasi rute US East."
  },
  {
    id: "steam-us-west",
    label: "Steam CDN US West",
    group: "Steam/CDN",
    region: "California / Oregon",
    hosts: ["s3.us-west-1.amazonaws.com", "s3.us-west-2.amazonaws.com"],
    note: "Estimasi rute US West."
  },
  {
    id: "steam-cloudflare",
    label: "Steam/CDN Local Edge",
    group: "Steam/CDN",
    region: "Nearest Cloudflare edge",
    hosts: ["speed.cloudflare.com", "cloudflare.com"],
    note: "Pembanding edge CDN terdekat; bukan server Steam."
  }
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function securityHeaders(extra = {}) {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://speed.cloudflare.com https://locate.measurementlab.net wss://*.measurementlab.net https://*.measurementlab.net; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; object-src 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    Pragma: "no-cache",
    Expires: "0",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
    ...extra
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, securityHeaders({ "Content-Type": "application/json; charset=utf-8" }));
  res.end(JSON.stringify(body));
}

function parseKeyValue(text) {
  return Object.fromEntries(String(text).trim().split(/\n+/).map((line) => {
    const index = line.indexOf("=");
    return index === -1 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)];
  }));
}

function normalizeIp(value = "") {
  return String(value)
    .replace(/^::ffff:/, "")
    .replace(/^::1$/, "127.0.0.1");
}

function clientIp(req) {
  const real = req.headers["x-real-ip"];
  if (real) return normalizeIp(String(real).trim());
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return normalizeIp(String(forwarded).split(",")[0].trim());
  return normalizeIp(req.socket.remoteAddress || "");
}

function isPrivateIp(ip) {
  const value = normalizeIp(ip);
  if (value === "127.0.0.1" || value === "localhost") return true;
  if (value.startsWith("10.")) return true;
  if (value.startsWith("192.168.")) return true;
  const parts = value.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part))) {
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  return value === "::1";
}

function cleanProfileText(value, fallback = "-") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 160) : fallback;
}

async function fetchClientProfile(ip) {
  const fallback = {
    ok: true,
    ip,
    isp: "ISP tidak tersedia",
    org: "-",
    asn: "-",
    city: "-",
    region: "-",
    country: "-",
    location: "-",
    source: "request"
  };
  if (!ip || isPrivateIp(ip)) return fallback; // Fast path for private IPs

  const cached = profileCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.value; // Use cache

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(`${IP_PROFILE_API}/${encodeURIComponent(ip)}`, {
      cache: "no-store",
      signal: controller.signal
    });
    const body = await response.json();
    if (!response.ok || body.success === false) throw new Error(body.message || `HTTP ${response.status}`);
    const profile = {
      ok: true,
      ip,
      isp: cleanProfileText(body.connection?.isp, fallback.isp),
      org: cleanProfileText(body.connection?.org),
      asn: body.connection?.asn ? `AS${body.connection.asn}` : "-",
      city: cleanProfileText(body.city),
      region: cleanProfileText(body.region),
      country: cleanProfileText(body.country),
      location: [body.city, body.region, body.country].map((item) => cleanProfileText(item, "")).filter(Boolean).join(", ") || "-",
      source: "ipwho.is"
    };
    profileCache.set(ip, { value: profile, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
    return profile;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function isAllowedClient(req) {
  return PUBLIC_MODE || isPrivateIp(clientIp(req));
}

function rateLimit(req, key, limit, windowMs) {
  const ip = clientIp(req);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = rateBuckets.get(bucketKey);
  if (!bucket || now - bucket.startedAt > windowMs) {
    rateBuckets.set(bucketKey, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

function cleanupBuckets() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.startedAt < cutoff) rateBuckets.delete(key);
  }
}

function localIps() {
  const result = [];
  const interfaces = os.networkInterfaces();
  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const item of addresses || []) {
      if (item.family === "IPv4" && !item.internal) {
        result.push({ name, address: item.address });
      }
    }
  }
  return result;
}

function byteParam(url, name, fallback, min, max) {
  const raw = Number(url.searchParams.get(name));
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(raw)));
}

function handleInfo(req, res) {
  sendJson(res, 200, {
    ok: true,
    serverName: process.env.SPEEDTEST_SERVER_NAME || os.hostname(),
    serverHost: req.headers.host || "",
    serverIps: localIps(),
    clientIp: clientIp(req),
    protocol: req.headers["x-forwarded-proto"] || "http",
    node: process.version,
    platform: `${os.type()} ${os.release()} ${os.arch()}`,
    uptimeSeconds: Math.round(process.uptime()),
    now: new Date().toISOString()
  });
}

async function handleClientProfile(req, res) {
  if (!rateLimit(req, "client-profile", 60, 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Terlalu banyak request profil client dari IP ini" });
  }
  const profile = await fetchClientProfile(clientIp(req));
  return sendJson(res, 200, profile);
}

function handlePing(req, res, url) {
  if (!rateLimit(req, "ping", 240, 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Terlalu banyak request ping dari IP ini" });
  }
  sendJson(res, 200, {
    ok: true,
    seq: url.searchParams.get("seq") || "",
    serverTime: Date.now()
  });
}

function targetPublicInfo(target) {
  return {
    id: target.id,
    label: target.label,
    group: target.group,
    region: target.region,
    note: target.note
  };
}

function handleRegionTargets(req, res) {
  sendJson(res, 200, {
    ok: true,
    targets: REGION_TARGETS.map(targetPublicInfo)
  });
}

function tcpProbe(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const startedAt = process.hrtime.bigint();
    const socket = net.createConnection({ host, port });
    let settled = false;

    function done(ok, error = "") {
      if (settled) return;
      settled = true;
      socket.destroy();
      const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      resolve({ ok, elapsedMs, error });
    }

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false, "timeout"));
    socket.once("error", (error) => done(false, error.code || error.message));
  });
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

async function probeTarget(target, samples) {
  const hostPromises = target.hosts.map(async (host) => {
    const rows = [];
    for (let i = 0; i < samples; i++) {
      rows.push(await tcpProbe(host, 443));
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    
    const ok = rows.filter((row) => row.ok).map((row) => row.elapsedMs);
    const diffs = ok.slice(1).map((value, index) => Math.abs(value - ok[index]));
    
    return {
      host,
      ok: ok.length,
      samples: rows.length,
      avgMs: avg(ok),
      bestMs: ok.length ? Math.min(...ok) : null,
      jitterMs: avg(diffs),
      loss: rows.length ? ((rows.length - ok.length) / rows.length) * 100 : null,
      errors: rows.filter((row) => !row.ok).map((row) => row.error).filter(Boolean)
    };
  });
  
  const hostResults = await Promise.all(hostPromises);

  const usable = hostResults.filter((row) => Number.isFinite(row.avgMs));
  const best = usable.sort((a, b) => a.avgMs - b.avgMs)[0] || null;
  return {
    ...targetPublicInfo(target),
    bestHost: best?.host || "",
    avgMs: best?.avgMs ?? null,
    bestMs: best?.bestMs ?? null,
    jitterMs: best?.jitterMs ?? null,
    loss: best?.loss ?? null,
    hosts: hostResults
  };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function handleRegionProbe(req, res, url) {
  if (!rateLimit(req, "region-probe", 20, 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Rate limit exceeded" });
  }
  
  const ids = String(url.searchParams.get("ids") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const samples = Math.max(2, Math.min(10, Number(url.searchParams.get("samples")) || 4));
  
  // Filter targets by ID or use all
  const selected = ids.length
    ? REGION_TARGETS.filter((target) => ids.includes(target.id))
    : REGION_TARGETS;

  if (!selected.length) {
    return sendJson(res, 400, { ok: false, error: "Invalid target" });
  }

  try {
    // Parallel probe with concurrency limit (8 at a time for speed)
    const results = await mapLimit(selected, 8, (target) => probeTarget(target, samples));
    return sendJson(res, 200, { ok: true, samples, results });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
}

async function handleResolve(req, res, url) {
  if (!rateLimit(req, "resolve", 60, 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Terlalu banyak request resolve dari IP ini" });
  }
  const host = String(url.searchParams.get("host") || "").trim().toLowerCase();
  if (!/^[a-z0-9.-]{1,253}$/.test(host) || host.includes("..")) {
    return sendJson(res, 400, { ok: false, error: "Host tidak valid" });
  }

  try {
    const rows = await dns.lookup(host, { all: true });
    return sendJson(res, 200, {
      ok: true,
      host,
      addresses: rows.map((row) => ({ address: row.address, family: row.family }))
    });
  } catch (error) {
    return sendJson(res, 502, { ok: false, error: error.message, host, addresses: [] });
  }
}

async function handlePublicTrace(req, res) {
  try {
    const response = await fetch(`${CLOUDFLARE_TRACE}?t=${Date.now()}`, { cache: "no-store" });
    const text = await response.text();
    return sendJson(res, 200, { ok: response.ok, trace: parseKeyValue(text) });
  } catch (error) {
    return sendJson(res, 502, { ok: false, error: error.message, trace: {} });
  }
}

function handleDownload(req, res, url) {
  if (!rateLimit(req, "download", 180, 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Terlalu banyak request download dari IP ini" });
  }
  const totalBytes = byteParam(url, "size", 25 * 1024 * 1024, 1024, MAX_DOWNLOAD_BYTES);
  const chunk = crypto.randomBytes(64 * 1024);

  res.writeHead(200, securityHeaders({
    "Content-Type": "application/octet-stream",
    "Content-Length": totalBytes,
    "X-Speedtest-Bytes": totalBytes,
    "X-Content-Type-Options": "nosniff"
  }));

  let sent = 0;
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
  if (!rateLimit(req, "upload", 60, 60 * 1000)) {
    sendJson(res, 429, { ok: false, error: "Terlalu banyak request upload dari IP ini" });
    req.destroy();
    return;
  }
  const startedAt = process.hrtime.bigint();
  let received = 0;
  let rejected = false;

  req.on("data", (chunk) => {
    received += chunk.length;
    if (received > MAX_UPLOAD_BYTES && !rejected) {
      rejected = true;
      sendJson(res, 413, { ok: false, error: "Upload terlalu besar", receivedBytes: received });
      req.destroy();
    }
  });

  req.on("end", () => {
    if (rejected) return;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    sendJson(res, 200, {
      ok: true,
      receivedBytes: received,
      serverDurationMs: Math.round(durationMs * 100) / 100,
      serverTime: Date.now()
    });
  });

  req.on("error", (error) => {
    if (!res.headersSent) sendJson(res, 500, { ok: false, error: error.message });
  });
}

async function handleInternetUploadStream(req, res, url) {
  if (!rateLimit(req, "internet-upload", 12, 10 * 60 * 1000)) {
    return sendJson(res, 429, { ok: false, error: "Terlalu banyak test upload internet dari IP ini" });
  }
  const ip = clientIp(req);
  const requestedBytes = Math.max(0, Math.min(MAX_UPLOAD_BYTES, Number(url.searchParams.get("bytes")) || 0));
  const durationLimit = requestedBytes > 0 ? 20 * 60 * 1000 : 30000;
  const durationMs = Math.max(1000, Math.min(durationLimit, Number(url.searchParams.get("duration")) || 8000));
  const chunkSize = Math.max(16 * 1024, Math.min(1024 * 1024, Number(url.searchParams.get("chunk")) || 256 * 1024));
  const sampleMs = Math.max(100, Math.min(2000, Number(url.searchParams.get("sample")) || 250));
  const streams = Math.max(1, Math.min(12, Number(url.searchParams.get("streams")) || 6));
  const activeForIp = activeUploadStreams.get(ip) || 0;
  if (activeForIp + streams > MAX_CONCURRENT_UPLOAD_STREAMS) {
    return sendJson(res, 429, { ok: false, error: "Upload stream aktif terlalu banyak dari IP ini" });
  }
  activeUploadStreams.set(ip, activeForIp + streams);
  const chunk = Buffer.alloc(chunkSize);
  const startedAtMs = Number(process.hrtime.bigint()) / 1e6;
  const stopAt = Date.now() + durationMs;
  let totalBytes = 0;
  let sampleBytes = 0;
  let firstByteAtMs = null;
  let lastByteAtMs = null;
  let lastSampleAt = startedAtMs;
  let closed = false;
  const abort = new AbortController();

  res.writeHead(200, securityHeaders({
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "X-Accel-Buffering": "no"
  }));

  req.on("aborted", () => {
    closed = true;
    abort.abort();
  });

  res.on("close", () => {
    closed = true;
    abort.abort();
  });

  function elapsedMs() {
    if (firstByteAtMs === null || lastByteAtMs === null) return 0;
    return Math.max(0, lastByteAtMs - firstByteAtMs);
  }

  function writeEvent(event) {
    if (!closed && !res.destroyed) res.write(`${JSON.stringify(event)}\n`);
  }

  function addBytes(size) {
    const nowMs = Number(process.hrtime.bigint()) / 1e6;
    if (firstByteAtMs === null) firstByteAtMs = nowMs;
    lastByteAtMs = nowMs;
    totalBytes += size;
    sampleBytes += size;
    writeProgress(false);
  }

  function writeProgress(force = false) {
    const nowMs = Number(process.hrtime.bigint()) / 1e6;
    const deltaMs = nowMs - lastSampleAt;
    if (!force && deltaMs < sampleMs) return;
    if (sampleBytes <= 0 || deltaMs <= 0) return;
    writeEvent({
      type: "progress",
      bytes: sampleBytes,
      elapsedMs: deltaMs,
      totalBytes,
      totalElapsedMs: elapsedMs()
    });
    sampleBytes = 0;
    lastSampleAt = nowMs;
  }

  async function* bodyGenerator() {
    while (!closed && !abort.signal.aborted && Date.now() < stopAt && (!requestedBytes || totalBytes < requestedBytes)) {
      const remaining = requestedBytes ? requestedBytes - totalBytes : chunk.length;
      const part = remaining >= chunk.length ? chunk : chunk.subarray(0, Math.max(0, remaining));
      if (!part.length) break;
      addBytes(part.length);
      yield part;
      await new Promise((resolve) => setImmediate(resolve));
    }
    writeProgress(true);
  }

  async function runStream(index) {
    const response = await fetch(`${INTERNET_UPLOAD_TARGET}?stream=${index}&t=${Date.now()}`, {
      method: "POST",
      body: Readable.from(bodyGenerator()),
      duplex: "half",
      signal: abort.signal
    });
    await response.text().catch(() => "");
    if (!response.ok) throw new Error(`Cloudflare upload HTTP ${response.status}`);
  }

  writeEvent({ type: "start", target: INTERNET_UPLOAD_TARGET, durationMs, streams, requestedBytes });

  try {
    await Promise.all(Array.from({ length: streams }, (_, index) => runStream(index)));

    const totalElapsedMs = elapsedMs();
    writeEvent({
      type: "done",
      totalBytes,
      elapsedMs: totalElapsedMs,
      mbps: totalElapsedMs > 0 ? (totalBytes * 8) / (totalElapsedMs / 1000) / 1_000_000 : 0
    });
  } catch (error) {
    abort.abort();
    writeEvent({ type: "error", error: error.message });
  } finally {
    activeUploadStreams.set(ip, Math.max(0, (activeUploadStreams.get(ip) || streams) - streams));
    if (!closed && !res.destroyed) res.end();
  }
}

function serveStatic(req, res, pathname) {
  const route = pathname === "/" ? "/speedtest.html" : pathname;
  const safePath = path.resolve(ROOT, `.${decodeURIComponent(route)}`);
  if (safePath !== ROOT && !safePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    res.end("Forbidden");
    return;
  }

  fs.readFile(safePath, (error, data) => {
    if (error) {
      res.writeHead(404, securityHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
      res.end("Not Found");
      return;
    }
    res.writeHead(200, securityHeaders({
      "Content-Type": mime[path.extname(safePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    }));
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  cleanupBuckets();
  if (String(req.url || "").length > MAX_URL_LENGTH) {
    return sendJson(res, 414, { ok: false, error: "URL terlalu panjang" });
  }
  if (!isAllowedClient(req)) {
    return sendJson(res, 403, { ok: false, error: "Server ini dikunci untuk localhost/LAN. Set SPEEDTEST_PUBLIC=1 hanya kalau sudah pakai firewall/reverse proxy." });
  }
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, securityHeaders());
    res.end();
    return;
  }

  if (url.pathname === "/api/info" && req.method === "GET") return handleInfo(req, res);
  if (url.pathname === "/api/client-profile" && req.method === "GET") return handleClientProfile(req, res);
  if (url.pathname === "/api/ping" && req.method === "GET") return handlePing(req, res, url);
  if (url.pathname === "/api/region-targets" && req.method === "GET") return handleRegionTargets(req, res);
  if (url.pathname === "/api/region-probe" && req.method === "GET") return handleRegionProbe(req, res, url);
  if (url.pathname === "/api/public-trace" && req.method === "GET") return handlePublicTrace(req, res);
  if (url.pathname === "/api/resolve" && req.method === "GET") return handleResolve(req, res, url);
  if (url.pathname === "/api/download" && req.method === "GET") return handleDownload(req, res, url);
  if (url.pathname === "/api/upload" && req.method === "POST") return handleUpload(req, res);
  if (url.pathname === "/api/internet/upload-stream" && req.method === "GET") return handleInternetUploadStream(req, res, url);
  if (url.pathname.startsWith("/api/")) {
    return sendJson(res, 404, { ok: false, error: "Endpoint speed test tidak ditemukan" });
  }

  return serveStatic(req, res, url.pathname);
});

server.requestTimeout = 25 * 60 * 1000;
server.headersTimeout = 30 * 1000;
server.keepAliveTimeout = 5 * 1000;
server.maxHeadersCount = 64;

server.on("clientError", (error, socket) => {
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`SpeedTest web running: http://localhost:${PORT}`);
  console.log(`Bind host: ${HOST}`);
  console.log(`Public mode: ${PUBLIC_MODE ? "ON" : "OFF - localhost/LAN only"}`);
});
