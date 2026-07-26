@echo off
cd /d "%~dp0"
echo Starting Speed Test on http://localhost:9090/
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:9090/'"
node speedtest-server.js
pause
