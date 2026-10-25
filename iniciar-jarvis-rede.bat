@echo off
setlocal
cd /d "%~dp0"
set "JARVIS_LAN_HOST=192.168.0.132"
set "JARVIS_LAN_PORT=3767"
set "JARVIS_PORT=3766"
powershell -NoProfile -Command "try { $null=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:3766/api/state; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  echo Inicie primeiro o Jarvis com iniciar-jarvis-dual.bat
  pause
  exit /b 1
)
powershell -NoProfile -Command "try { $null=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://%JARVIS_LAN_HOST%:%JARVIS_LAN_PORT%/api/state; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "JARVIS V4.3 - VISUALIZADOR REDE LOCAL" cmd /k "set JARVIS_LAN_HOST=%JARVIS_LAN_HOST%&& set JARVIS_LAN_PORT=%JARVIS_LAN_PORT%&& set JARVIS_PORT=3766&& node src\lan-viewer.mjs"
  timeout /t 2 /nobreak >nul
)
echo Abrir no celular/tablet/computador na mesma rede:
echo http://%JARVIS_LAN_HOST%:%JARVIS_LAN_PORT%/
echo Apenas visualizacao, sem comandos MCP.
start "" "http://%JARVIS_LAN_HOST%:%JARVIS_LAN_PORT%/"
endlocal
