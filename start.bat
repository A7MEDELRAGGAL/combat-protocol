@echo off
setlocal
cd /d "%~dp0"

set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%/?safe=1"

rem --- Locate a Chromium browser -------------------------------------------
set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

echo Starting Combat Protocol on reserved port %PORT%: %URL%
echo.

if defined BROWSER (
  rem Software WebGL (SwiftShader) keeps the game playable when the GPU driver
  rem or hardware acceleration is unavailable. Separate profile forces the
  rem flags to apply even when the browser is already running.
  start "" powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process -FilePath '%BROWSER%' -ArgumentList '--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-first-run','--no-default-browser-check','--user-data-dir=%LocalAppData%\CombatProtocol\browser-profile','--new-window','%URL%'"
) else (
  start "" powershell -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
)

node server.mjs
pause
