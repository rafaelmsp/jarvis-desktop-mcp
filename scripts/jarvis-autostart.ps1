# Gerencia somente o atalho de inicializacao do JARVIS para o usuario atual.
param([ValidateSet('install','remove','status')][string]$Mode='status')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$startup=[Environment]::GetFolderPath('Startup')
$link=Join-Path $startup 'JARVIS - Avatar Visual.lnk'
$script=Join-Path $PSScriptRoot 'jarvis-supervisor.ps1'
if($Mode -eq 'install'){
  if(-not (Test-Path $script)){throw 'Supervisor ausente'}
  $shell=New-Object -ComObject WScript.Shell
  $shortcut=$shell.CreateShortcut($link)
  $shortcut.TargetPath=(Get-Command powershell.exe).Source
  $shortcut.Arguments='-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$script+'"'
  $shortcut.WorkingDirectory=$root
  $shortcut.Description='JARVIS - restaurar painel, monitor de audio e visualizador LAN'
  $shortcut.Save()
  Write-Output 'JARVIS registrado no inicio do usuario.'
} elseif($Mode -eq 'remove'){
  if(Test-Path $link){Remove-Item -LiteralPath $link}
  Write-Output 'Atalho JARVIS removido.'
} else {
  Write-Output ('STARTUP='+[bool](Test-Path $link))
}
