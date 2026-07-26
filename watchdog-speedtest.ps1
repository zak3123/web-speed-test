$ErrorActionPreference = "SilentlyContinue"

$ProjectDir = "D:\SpeedTest-Gaming-Analyzer-GitHub"
$Port = 9090
$NodeExe = "node"
$LogDir = Join-Path $ProjectDir "logs"
$OutLog = Join-Path $LogDir "speedtest-out.log"
$ErrLog = Join-Path $LogDir "speedtest-err.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-SpeedTestPort {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return [bool]$conn
}

function Start-SpeedTestServer {
  Start-Process -FilePath $NodeExe `
    -ArgumentList "speedtest-server.js" `
    -WorkingDirectory $ProjectDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog | Out-Null
}

while ($true) {
  if (-not (Test-SpeedTestPort)) {
    Start-SpeedTestServer
    Start-Sleep -Seconds 3
  }
  Start-Sleep -Seconds 10
}
