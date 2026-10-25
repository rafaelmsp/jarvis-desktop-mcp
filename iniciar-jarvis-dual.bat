@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js 20+ nao foi encontrado.
  pause
  exit /b 1
)
echo JARVIS V4.7 - PC e CELULAR (sem voz propria)
echo.
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:3766/api/state; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo Iniciando avatar na porta 3766...
  start "JARVIS V4.7 - SERVIDOR" cmd /k "set JARVIS_PORT=3766&& node src\server.mjs"
  powershell -NoProfile -Command "Start-Sleep -Seconds 3"
) else (
  echo O painel na porta 3766 ja esta online.
)
echo Iniciando/reutilizando sincronismo de audio local...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-lipsync.ps1" -Mode start
echo.
echo O modo CELULAR continua disponivel via ChatGPT + MCP Desktop Commander.
echo Sua voz sai somente do ChatGPT; o Jarvis apenas anima o rosto.
start "" "http://127.0.0.1:3766/"
endlocal
