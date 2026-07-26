# SpeedTest Gaming Analyzer

Web speed test lokal untuk estimasi:

- Download, upload, throughput, latency, jitter, packet loss.
- Upload payload sampai `1GB` untuk test sustained upload.
- Estimasi Steam `MB/s`.
- Estimasi waktu download game Steam.
- Rating main game online, termasuk War Thunder.
- Region checker untuk War Thunder SA/NA/EU/CIS dan Steam/CDN.
- Region checker untuk Mobile Legends, Project Sekai, Arena Breakout, Call of Duty, Delta Force, PUBG PC, dan PUBG Mobile.
- Total target region sekarang 87 target publik, termasuk split US East/West, EU Central/West, SEA, Japan, Korea, Hong Kong, Middle East, Brazil, Australia, dan Steam/CDN.
- Rating cloud gaming dan live streaming.
- Akses LAN dari komputer lain.

## Jalankan

Cara paling mudah:

```bat
BUKA_SPEEDTEST.bat
```

Atau lewat terminal:

```bash
npm start
```

Lalu buka:

```text
http://localhost:9090/
```

## Akses Dari Komputer Lain

Komputer lain harus satu Wi-Fi/LAN. Jangan pakai `localhost` di komputer lain.
Pakai IP komputer server yang tampil di bagian `LAN URL`, misalnya:

```text
http://192.168.1.4:9090/
```

Kalau tidak bisa dibuka, izinkan Node.js atau port `9090` di Windows Firewall.

## Keep Alive / Tetap Aktif

Server sekarang memakai watchdog:

```bat
START_WATCHDOG_SPEEDTEST.bat
```

Watchdog mengecek port `9090` tiap beberapa detik dan menyalakan ulang server kalau mati. Startup user juga dipasang lewat file:

```text
C:\Users\ZYREX\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\SpeedTest-Gaming-Analyzer-Startup.vbs
```

Artinya server otomatis hidup lagi setelah user Windows login.

## Catatan Akurasi

Mode utama memakai Cloudflare multi-stream untuk estimasi CDN/Steam/Fast-style.
Untuk pembanding lintas server, pakai `Compare: M-Lab + Cloudflare`.
Untuk upload dari komputer lain lewat LAN, pakai `M-Lab NDT7 only` atau `Compare`.
Upload payload `1 GB` bisa lebih stabil untuk koneksi cepat, tapi akan memakai kuota dan waktu lebih banyak. Untuk koneksi upload lambat, 1 GB bisa berjalan lama karena app memberi waktu sampai 20 menit.

Region checker memakai endpoint publik per region sebagai aproksimasi rute. Itu bukan IP resmi server game karena IP asli banyak game sering tidak dipublikasikan, berubah, atau dilindungi anti-DDoS/CDN. Gunakan ini sebagai pembanding rute, lalu konfirmasi dengan ping di dalam game.

## Mbps vs MB/s

Speedtest memakai `Mbps` atau megabit per detik.
Steam biasanya menampilkan `MB/s` atau megabyte per detik.

```text
100 Mbps / 8 = 12.5 MB/s
```

Praktiknya Steam bisa terlihat sekitar `10-12 MB/s` karena overhead, server Steam, routing ISP, Wi-Fi, disk, dan CPU.

## GitHub / Domain

Project ini butuh Node.js backend. Hosting statis saja tidak cukup untuk semua fitur.
Untuk domain public, upload ke VPS/hosting Node.js lalu pasang reverse proxy HTTPS.

## Security

Default server dikunci untuk localhost/LAN. Public internet tidak aktif kecuali environment `SPEEDTEST_PUBLIC=1` diset manual.

Proteksi yang dipasang:

- Security headers: CSP, X-Frame-Options, nosniff, referrer-policy.
- Rate limit per IP untuk ping, download, upload, resolve, region probe, dan upload internet.
- Upload maksimum `1 GB` dan jumlah upload stream aktif dibatasi.
- URL panjang ditolak.
- Static file path dikunci di folder project.
- Region probe hanya memakai daftar target yang sudah di-allowlist di kode.

Untuk domain publik, tetap wajib pakai HTTPS reverse proxy, firewall, dan jangan expose port langsung tanpa pembatasan tambahan.
