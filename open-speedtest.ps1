$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = Get-NetTCPConnection -LocalPort 9090 -State Listen -ErrorAction SilentlyContinue

if (-not $listener) {
  Start-Process -FilePath "node" -ArgumentList "speedtest-server.js" -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Milliseconds 1200
}

Start-Process "http://localhost:9090/"
