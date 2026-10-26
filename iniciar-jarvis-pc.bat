@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo JARVIS PC: Node.js nao encontrado.
  exit /b 1
)
echo JARVIS - MODO WINDOWS / CHROME
powershell -NoProfile -Command "try { $x=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3766/api/state' -TimeoutSec 2; if ($x.StatusCode -ne 200) {exit 1} } catch {exit 1}"
if errorlevel 1 (
  echo Inicializando JARVIS na porta 3766...
  start "JARVIS DESKTOP" cmd /k "set JARVIS_PORT=3766&& node src\server.mjs"
  timeout /t 3 /nobreak >nul
) else (
  echo JARVIS ja esta online na porta 3766.
)
echo Sincronizando animacao com a saida de audio do Windows...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-lipsync.ps1" -Mode start
if errorlevel 1 (
  echo Falha ao iniciar o monitor. Confira o Python isolado de audio.
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\jarvis-voice.ps1" -Mode on
if errorlevel 1 (
  echo Falha ao iniciar a sessao visual.
  exit /b 1
)
echo.
echo JARVIS PC: pronto. Avatar apenas visual; o audio permanece no ChatGPT.
start "" "http://127.0.0.1:3766/"
endlocal
