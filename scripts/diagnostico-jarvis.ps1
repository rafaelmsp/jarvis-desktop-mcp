# Diagnostico JARVIS V4.8 (somente leitura, sem tokens ou mudancas).
$ErrorActionPreference='Continue'
function status($name,$value){ Write-Output ('{0}: {1}' -f $name,$value) }
$root=Split-Path -Parent $PSScriptRoot
status 'BRANCH' (& git -C $root branch --show-current 2>$null)
$status = & git -C $root status --porcelain 2>$null
status 'ALTERACOES_LOCAIS' @($status).Count
$link=Join-Path ([Environment]::GetFolderPath('Startup')) 'JARVIS - Avatar Visual.lnk'
status 'INICIO_COM_WINDOWS' ([bool](Test-Path $link))
$profile=Get-NetFirewallProfile -Name Private -ErrorAction SilentlyContinue
status 'FIREWALL_PRIVADO' $(if($profile.Enabled){'ATIVO'}else{'DESATIVADO'})
try{
  $core=Invoke-RestMethod 'http://127.0.0.1:3766/api/state' -TimeoutSec 3
  status 'CORE_3766' 'ONLINE'
  status 'SESSAO_VISUAL' $core.voiceSession
  status 'SINCRONISMO_WINDOWS' $core.audioSync
  status 'EXPRESSAO' $core.expression
  status 'HUMOR_VISUAL' $core.mood
}catch{status 'CORE_3766' 'OFFLINE'}
$config=Get-NetIPConfiguration -ErrorAction SilentlyContinue | Where-Object {$_.IPv4DefaultGateway -and $_.IPv4Address} | Select-Object -First 1
$lanIp=$config.IPv4Address.IPAddress
if($lanIp){
  status 'IP_LOCAL' $lanIp
  try{
    $lan=Invoke-RestMethod ('http://{0}:3767/api/state' -f $lanIp) -TimeoutSec 3
    status 'VISUALIZADOR_3767' 'ONLINE'
    status 'LINK_LAN' ('http://{0}:3767/' -f $lanIp)
    status 'LAN_HUMOR' $lan.mood
  }catch{status 'VISUALIZADOR_3767' 'OFFLINE'}
}else{status 'VISUALIZADOR_3767' 'SEM_IP'}
$monitor=@(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {$_.Name -in @('python.exe','pythonw.exe') -and $_.CommandLine -like '*jarvis-lipsync.py*'})
status 'MONITOR_WASAPI' $(if($monitor.Count){'EXECUTANDO'}else{'PARADO'})
Write-Output 'Diagnostico concluido. Nenhuma configuracao alterada.'
