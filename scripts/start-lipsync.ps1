# JARVIS — monitor de amplitude de áudio WASAPI (sem guardar PCM)
param(
  [ValidateSet('start','stop','status')][string]$Mode='status',
  [int]$Port=3766
)
$ErrorActionPreference='Stop'
$py=Join-Path $env:LOCALAPPDATA 'JarvisLipSync\venv\Scripts\python.exe'
$script=Join-Path $PSScriptRoot 'jarvis-lipsync.py'
$logDir=Join-Path $env:LOCALAPPDATA 'JarvisLipSync'
$active=@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -in @('python.exe','pythonw.exe') -and $_.CommandLine -like '*jarvis-lipsync.py*'
})
if($Mode -eq 'start') {
  if($active.Count -gt 0) { Write-Output ('Monitor em execução. PID: '+($active.ProcessId -join ', ')); exit 0 }
  if(-not (Test-Path $py)) {throw "Python isolado não instalado: $py"}
  if(-not (Test-Path $script)) {throw "Script não localizado: $script"}
  try {$null=Invoke-RestMethod "http://127.0.0.1:$Port/api/state" -TimeoutSec 3}
  catch {throw "Inicie o painel JARVIS na porta $Port antes do monitor."}
  $env:JARVIS_PORT="$Port"
  $p=Start-Process -FilePath $py -ArgumentList ('"'+$script+'"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'stdout.log') -RedirectStandardError (Join-Path $logDir 'stderr.log') -PassThru
  Write-Output "Sincronismo de áudio iniciado (PID $($p.Id)). Ative a sessão visual no painel."
} elseif($Mode -eq 'stop') {
  foreach($proc in $active) {Stop-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue}
  $tokenPath=Join-Path $HOME ".jarvis-desktop-mcp-token-$Port"
  if(Test-Path $tokenPath) {
    try {
      $token=(Get-Content $tokenPath -Raw).Trim()
      $null=Invoke-RestMethod "http://127.0.0.1:$Port/api/control" -Method Post -ContentType 'application/json' -Headers @{'X-Jarvis-Token'=$token} -Body '{"action":"set_audio_sync","value":false}' -TimeoutSec 3
    } catch {Write-Warning 'Não foi possível atualizar o estado no painel.'}
  }
  Write-Output "Monitor de áudio interrompido."
} else {
  if($active.Count) { Write-Output ('Monitor ligado. PID: '+($active.ProcessId -join ', ')) }
  else {Write-Output 'Monitor desligado.'}
  try {
    $s=Invoke-RestMethod "http://127.0.0.1:$Port/api/state" -TimeoutSec 3
    Write-Output ("Sessão visual: {0}, sincronismo: {1}, expressão: {2}, nível: {3}" -f $s.voiceSession,$s.audioSync,$s.expression,$s.audioLevel)
  } catch { Write-Output "Painel JARVIS indisponível na porta $Port." }
}
