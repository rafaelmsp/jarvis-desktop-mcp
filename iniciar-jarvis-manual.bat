@echo off
setlocal
cd /d "%~dp0"
title JARVIS V4.8 - Inicio manual
echo ========================================
echo  JARVIS V4.8 / PC + CELULAR
echo  Inicializacao SOMENTE MANUAL
echo ========================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao foi encontrado.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-jarvis.ps1" -RequireAll
if errorlevel 1 (
  echo ERRO ao inicializar algum componente. Consulte os avisos acima.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\jarvis-voice.ps1" -Mode on
if errorlevel 1 (
  echo ERRO ao habilitar a sessao visual.
  pause
  exit /b 1
)
echo.
echo Painel PC: http://127.0.0.1:3766/
echo Rede: consulte o IP atual em 'iniciar-jarvis-rede.bat'
echo O audio e do ChatGPT. O rosto JARVIS permanece silencioso.
echo NADA sera instalado para iniciar junto com Windows.
start "" "http://127.0.0.1:3766/"
endlocal
