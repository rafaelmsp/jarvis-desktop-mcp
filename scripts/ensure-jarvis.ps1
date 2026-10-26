# JARVIS: verifica/reinicia apenas os servicos deste projeto, sem elevar privilegios.
param([switch]$Quiet,[switch]$RequireAll)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$logDir=Join-Path $env:LOCALAPPDATA 'JarvisAutostart'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
function note($message){if(-not $Quiet){Write-Output $message}}
$warnings=@()
try {
  $state=Invoke-RestMethod 'http://127.0.0.1:3766/api/state' -TimeoutSec 2
  if($null -eq $state.mode){throw 'Resposta invalida'}
  note 'CORE: online na porta 3766'
} catch {
  $occupied=Get-NetTCPConnection -LocalPort 3766 -State Listen -ErrorAction SilentlyContinue
  if($occupied){throw 'Porta 3766 ocupada por outro processo; nenhuma alteracao efetuada'}
  $node=(Get-Command node.exe -ErrorAction Stop).Source
  $env:JARVIS_PORT='3766'
  $p=Start-Process -FilePath $node -ArgumentList 'src/server.mjs' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'core-out.log') -RedirectStandardError (Join-Path $logDir 'core-err.log')
  $ready=$false
  for($i=0;$i -lt 24;$i++){
    Start-Sleep -Milliseconds 200
    try{if((Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:3766/api/state' -TimeoutSec 2).StatusCode -eq 200){$ready=$true;break}}catch{}
  }
  if(-not $ready){throw "CORE nao iniciou, PID $($p.Id)"}
  note ('CORE: recuperado PID '+$p.Id)
}
try {
  & (Join-Path $PSScriptRoot 'start-lipsync.ps1') -Mode start | Out-Null
  note 'AUDIO: monitor de loopback verificado'
} catch {$warnings+=('AUDIO: '+$_.Exception.Message);note ('AUDIO: aviso '+$_.Exception.Message)}
try {
  & (Join-Path $PSScriptRoot 'start-lan-viewer.ps1') -NoBrowser | Out-Null
  note 'LAN: visualizador verificado'
} catch {$warnings+=('LAN: '+$_.Exception.Message);note ('LAN: aviso '+$_.Exception.Message)}
if($RequireAll -and $warnings.Count){throw ('Componentes indisponiveis: '+($warnings -join '; '))}
