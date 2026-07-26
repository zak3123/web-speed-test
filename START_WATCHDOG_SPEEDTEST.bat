@echo off
cd /d D:\SpeedTest-Gaming-Analyzer-GitHub
start "SpeedTest Watchdog" /min powershell -NoProfile -ExecutionPolicy Bypass -File "D:\SpeedTest-Gaming-Analyzer-GitHub\watchdog-speedtest.ps1"
echo SpeedTest watchdog aktif. Buka http://localhost:9090/
