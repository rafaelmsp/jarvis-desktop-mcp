@echo off
setlocal
cd /d "%~dp0"
echo JARVIS / AUTORIZACAO OPCIONAL DE FIREWALL
echo.
echo Este procedimento exige sua confirmacao de administrador no Windows.
echo Ele ativa o perfil PRIVADO e permite somente a porta TCP 3767
echo na sub-rede local da interface Ethernet.
echo Pode ser necessario ajustar regras de outros aplicativos de rede.
echo O MCP na porta 3766 NAO sera liberado para a rede.
echo.
choice /C SN /N /M "Deseja configurar o firewall agora? (S/N) "
if errorlevel 2 exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -Command "$script=Join-Path (Get-Location) 'scripts\apply-jarvis-firewall.ps1'; $opts='-NoProfile -ExecutionPolicy Bypass -File ""'+$script+'"" -Apply'; Start-Process -FilePath powershell.exe -Verb RunAs -Wait -ArgumentList $opts"
if errorlevel 1 (
  echo Nao foi possivel concluir a autorizacao. Consulte o Windows.
  pause
  exit /b 1
)
echo.
echo Confira o estado com scripts\diagnostico-jarvis.ps1
pause
endlocal
