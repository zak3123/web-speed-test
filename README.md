# SpeedTest Gaming Analyzer

## Overview

Web speed test lokal untuk analisis performa jaringan gaming dengan fitur lengkap:

- **Speed Test**: Download, upload, throughput, latency, jitter, packet loss
- **Upload Large**: Payload hingga 1GB untuk test sustained upload
- **Gaming Estimates**: Estimasi Steam MB/s dan waktu download game
- **Region Checker**: Support 87+ target (War Thunder, Mobile Legends, CS2, PUBG, COD, Delta Force)
- **Cloud Gaming**: Rating cloud gaming dan live streaming quality
- **LAN Access**: Akses dari komputer lain dalam network yang sama

## Quick Start

Cara paling mudah - jalankan direktori project:

```bash
node speedtest-server.js
```

Atau buka CMD di folder project:

```bat
start-speedtest.bat
```

Lalu buka browser:

```text
http://localhost:9090/
```

## LAN Access

Komputer lain harus satu network/Wi-Fi. Gunakan IP server (lihat di halaman):

```text
http://192.168.1.4:9090/
```

Jika tidak bisa, izinkan Node.js/port 9090 di Windows Firewall.

## Keep Alive / Auto-start

### Watchdog (Auto restart jika crash)

```bat
START_WATCHDOG_SPEEDTEST.bat
```

### Startup Windows (Start after login)

```bat
INSTALL_STARTUP_WATCHDOG.bat
```

Watchdog dan startup akan menjaga server tetap aktif otomatis.

## uninstall

Untuk menghapus startup/watchdog:

```bat
UNINSTALL_STARTUP_WATCHDOG.bat
```

## Settings

### Test Duration

- 15 detik: Lebih akurat untuk koneksi cepat
- 10 detik: Stabil untuk semua koneksi
- 6 detik: Cepat untuk quick check

### Parallel Streams

- 8 stream: Memenuhi bandwidth maksimal
- 6 stream: Akurat dan stabil
- 4 stream: Balanced
- 2 stream: Ringan untuk koneksi lambat

### Upload Payload

- Ikuti durasi: Sesuai setting duration
- 100 MB: Cepat, cocok upload < 20 Mbps
- 256 MB: Stabil (default)
- 512 MB - 1 GB: Akurat untuk koneksi > 50 Mbps

## Technical Details

### Engines

| Mode | Description | Best For |
|------|-------------|----------|
| Cloudflare multi-stream | Primary engine | CDN/Steam/Fast-style tests |
| Compare (M-Lab + Cloudflare) | Cross-engine validation | Linting comparison |
| M-Lab NDT7 only | Standard NDT7 | Upload from other devices |
| Local server | Diagnostic mode | LAN testing only |

### Mbps vs MB/s

Speed test menggunakan **Mbps** (megabit per second).

Steam menggunakan **MB/s** (Megabyte per second).

```
Rumus: 100 Mbps ÷ 8 = 12.5 MB/s
Realita: ~10-12 MB/s karena overhead
```

### Security

Server default locked untuk localhost/LAN. Untuk public deployment:

```bash
set SPEEDTEST_PUBLIC=1
```

Proteksi aktif:
- Rate limiting per IP
- Maximum upload 1GB
- URL length limit 2KB
- Security headers (CSP, X-Frame-Options, nosniff)
- Path traversal protection
- Region probe allowlist

## Region Targets

Total 87+ region targets untuk:

- **War Thunder**: SA, NA, EU, CIS, US East/West, Japan, London, Frankfurt
- **Mobile Legends**: ID, SEA, MY, PH, TH, VN, HK, US, EU
- **Project Sekai**: JP, KR, TW, SEA, Global, US East/West, EU, AU
- **Arena Breakout**: APAC, NA, EU, SA, Oceania, Japan/Korea, India, ME
- **Call of Duty**: SEA, HK, JP, KR, US East/West, EU, BR, Australia, ME
- **Delta Force**: ID, SG, HK, JP, ME, US East/West/Central, EU West, BR, Oceania
- **PUBG**: SEA, ID, TH, HK, KRJP, India, ME, EU, NA, US East/West, SA, Oceania
- **Steam/CDN**: SG, HK, JP, KR, AU, IN, US East/West, EU, EU London, BR, Cloudflare

## Performance Notes

### Accuracy Tips

1. **Download Test**: Gunakan 6-8 streams untuk saturasi bandwidth
2. **Upload Test**: 
   - < 20 Mbps: 100-256MB payload cukup
   - 20-100 Mbps: 256-512MB payload recommended
   - > 100 Mbps: 1GB payload untuk sustained test
   
3. **Latency/Jitter**: 18 sample probes dengan 70ms interval

### Limitations

- Region check menggunakan endpoint publik sebagai aproksimasi, bukan IP server resmi game
- Game server IP sering protected anti-DDoS atau menggunakan CDN dynamic
- Gunakan hasil sebagai guide, konfirmasi dengan in-game ping

## Troubleshooting

### Server tidak berjalan

1. Pastikan port 9090 tidak digunakan aplikasi lain
2. Check Windows Firewall rules
3. Restart watchdog service

### Test gagal/stuck

1. Coba engine berbeda (NDT7 untuk upload cross-device)
2. Kurangi parallel streams ke 2-4
3. Perpanjang timeout untuk upload besar

### Access dari komputer lain fail

1. Verify komputer dalam satu network
2. Allow port 9090 di Windows Firewall
3. Gunakan IP address langsung, bukan hostname

### Memory leak warnings

Server memiliki automatic cleanup untuk rate limit buckets setiap 10 menit. Restart jika memory持续增长 terus.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 9090 | Server port |
| HOST | 0.0.0.0 | Bind host |
| SPEEDTEST_PUBLIC | "1" | Enable public mode |
| SPEEDTEST_MAX_UPLOAD_STREAMS | 12 | Max concurrent uploads |

## Dependencies

- `@m-lab/ndt7` (^0.1.4): M-Lab measurement library for NDT7 protocol

## License

Private - Development Use Only

## Version History

- **v2.0.0**: Optimized code, improved caching, enhanced security
- **v1.0.0**: Initial release

---

For more information, see source code comments or PROJECT_STATUS.md
