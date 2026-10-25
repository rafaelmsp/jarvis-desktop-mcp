@echo off
setlocal
cd /d "%~dp0"
echo JARVIS - VISUALIZADOR DA REDE LOCAL
echo Detectando IPv4 privado automaticamente...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-lan-viewer.ps1"
if errorlevel 1 (
  echo Falha ao abrir o visualizador LAN. O servidor do PC permanece independente.
  exit /b 1
)
endlocal
