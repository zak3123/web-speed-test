Speed Test Gaming

Cara pakai:
1. Paling mudah: jalankan BUKA_SPEEDTEST.bat
2. Browser akan terbuka otomatis ke http://localhost:9090/
3. Klik Start

Alternatif:
- Jalankan start-speedtest.bat jika ingin melihat console server.
- Kalau muncul "localhost refused to connect", berarti server belum menyala. Jalankan BUKA_SPEEDTEST.bat lagi.

Akses dari komputer lain:
- Komputer lain harus satu Wi-Fi/LAN dengan komputer ini.
- Jangan buka http://localhost:9090/ di komputer lain, karena localhost berarti komputer itu sendiri.
- Pakai IP LAN komputer server, contoh saat ini:
  http://192.168.1.4:9090/
  http://192.168.100.2:9090/
- Kalau tidak bisa dibuka dari komputer lain, izinkan Node.js atau port 9090 di Windows Firewall.
- Halaman juga menampilkan LAN URL di bagian Connection Info.
- Untuk dijadikan web public/domain, baca BUAT_WEB_PUBLIC.txt.

Mode utama:
- Cloudflare multi-stream utama: cocok untuk estimasi Fast/Ookla style, Steam, game download, dan cloud gaming.
- Compare: M-Lab + Cloudflare: untuk cek apakah routing ISP ke server berbeda.
- M-Lab NDT7 only: pembanding M-Lab.
- Local server diagnostic: hanya test browser ke komputer ini, bukan internet speed.

Panel Gaming, Steam & Streaming:
- Steam speed memakai estimasi MB/s dari download final.
- Game 50 GB / 100 GB menghitung perkiraan waktu download.
- Game profile bisa dipilih, default War Thunder.
- Game profile sekarang termasuk Mobile Legends, Project Sekai, Arena Breakout, Call of Duty, Delta Force, PUBG PC, dan PUBG Mobile.
- Ukuran game/update bisa diedit karena ukuran Steam sering berubah.
- Online play menilai kemampuan main game dari latency, jitter, packet loss, download, dan upload.
- Cloud gaming melihat download, latency, jitter, dan packet loss.
- Live stream melihat upload final.

War Thunder dan game online:
- Mbps besar membantu download/update, tapi saat bermain yang paling penting adalah latency, jitter, dan packet loss.
- Latency rendah + jitter kecil + packet loss 0% lebih penting untuk gameplay daripada download besar.
- Jika speed download besar tapi packet loss/jitter tinggi, game tetap bisa terasa lag/stutter.

Server region checker:
- Bisa cek target game terpilih saja, mobile games pack, shooter pack, Steam/CDN, atau all targets.
- Hasilnya aproksimasi rute region, bukan IP resmi server game.
- Gunakan hasil ini untuk memilih region dengan latency paling rendah, jitter kecil, dan packet loss 0%.

Upload 1GB:
- Pilih Upload payload = 1 GB akurat jika ingin test upload sustained.
- Ini lebih berat dan memakai kuota lebih besar, jadi jangan dipakai jika paket internet terbatas.
- Untuk test cepat, pilih 100 MB atau 256 MB.

Catatan Mbps vs MB/s:
- Speedtest biasanya memakai Mbps = megabit per detik.
- Steam biasanya menampilkan MB/s = megabyte per detik.
- 1 byte = 8 bit, jadi 100 Mbps = 12.5 MB/s sebelum overhead.
- Praktiknya 100 Mbps biasanya terlihat sekitar 10 sampai 12 MB/s di Steam jika server Steam, routing ISP, disk, dan CPU stabil.
- 100 Mbps bukan berarti satu packet berukuran 100 Mbps. Packet internet adalah potongan kecil data; 100 Mbps adalah total laju transfer per detik.
