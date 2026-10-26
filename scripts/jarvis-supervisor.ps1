# JARVIS supervisor: apenas este projeto, sem elevacao, senha, microfone ou API externa.
$ErrorActionPreference='Continue'
$root=Split-Path -Parent $PSScriptRoot
$logDir=Join-Path $env:LOCALAPPDATA 'JarvisAutostart'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log=Join-Path $logDir 'supervisor.log'
$created=$false
$mutex=[System.Threading.Mutex]::new($false,'Local\JarvisAvatar-Supervisor-3766',[ref]$created)
if(-not $created){Write-Output 'JARVIS supervisor ja em execucao';$mutex.Dispose();exit 0}
function entry($msg){
  Add-Content -LiteralPath $log -Value ((Get-Date -Format 'yyyy-MM-dd HH:mm:ss')+' '+$msg) -Encoding UTF8
  if((Get-Item $log -ErrorAction SilentlyContinue).Length -gt 500000){
    Move-Item -LiteralPath $log -Destination ($log+'.old') -Force -ErrorAction SilentlyContinue
  }
}
try {
  $initial=$true
  $previouslyListening=$true
  while($true){
    $before=$null
    try{$before=Invoke-RestMethod -Uri 'http://127.0.0.1:3766/api/state' -TimeoutSec 2}catch{}
    if(-not $initial -and $before){$previouslyListening=[bool]$before.voiceSession}
    try{
      & (Join-Path $PSScriptRoot 'ensure-jarvis.ps1') -Quiet 2>&1 | Out-Null
      $after=Invoke-RestMethod -Uri 'http://127.0.0.1:3766/api/state' -TimeoutSec 3
      # So liga na inicializacao ou recuperacao se antes havia sessao ativa.
      if(($initial -or $null -eq $before) -and $previouslyListening -and -not $after.voiceSession){
        & (Join-Path $PSScriptRoot 'jarvis-voice.ps1') -Mode on 2>&1 | Out-Null
      }
    }catch{entry ('AVISO: '+$_.Exception.Message)}
    $initial=$false
    Start-Sleep -Seconds 25
  }
} finally {$mutex.ReleaseMutex();$mutex.Dispose()}
