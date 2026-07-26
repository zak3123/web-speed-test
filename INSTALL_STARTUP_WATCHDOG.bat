@echo off
schtasks /Create /TN "SpeedTest Gaming Analyzer Watchdog" /SC ONLOGON /RL LIMITED /F /TR "powershell -NoProfile -ExecutionPolicy Bypass -File \"D:\SpeedTest-Gaming-Analyzer-GitHub\watchdog-speedtest.ps1\""
if %ERRORLEVEL% EQU 0 (
  echo Watchdog sudah dipasang ke Task Scheduler untuk user ini.
  echo Server akan otomatis hidup setelah login Windows.
) else (
  echo Task Scheduler ditolak Windows. Pakai START_WATCHDOG_SPEEDTEST.bat atau folder Startup user.
  exit /b 1
)
