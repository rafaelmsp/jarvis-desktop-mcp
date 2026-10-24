@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale Node.js 20 ou superior.
  pause
  exit /b 1
)
start "JARVIS SERVER" cmd /k "node src\server.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3765"
