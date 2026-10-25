# JARVIS LAN Viewer — interface read-only with automatic private IPv4 selection.
# Does not change firewall or expose the MCP control port.
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$port=3767
$corePort=3766
$lanIp=$null
foreach($config in @(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -and $_.IPv4Address})){
  $profile=Get-NetConnectionProfile -InterfaceIndex $config.InterfaceIndex -ErrorAction SilentlyContinue
  if($profile.NetworkCategory -notin @('Private','DomainAuthenticated')){continue}
  foreach($ip in @($config.IPv4Address)){
    $addr=$ip.IPAddress
    if($addr -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'){
      $lanIp=$addr
      break
    }
  }
  if($lanIp){break}
}
if(-not $lanIp){throw 'Nenhum IPv4 privado com gateway em rede Privada foi encontrado. Nao alterei a firewall.'}
try {$null=Invoke-RestMethod ('http://127.0.0.1:{0}/api/state' -f $corePort) -TimeoutSec 3}
catch {throw 'Inicie primeiro o JARVIS no PC pela porta 3766.'}
$viewUrl='http://{0}:{1}/' -f $lanIp,$port
$existing=@(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
if($existing.Count){
  if(-not ($existing | Where-Object {$_.LocalAddress -eq $lanIp})){
    throw ('Porta 3767 em uso em outro endereco. Nao encerrei nenhum processo. Use o IP privado atual: '+$lanIp)
  }
  try{
    $r=Invoke-WebRequest $viewUrl -UseBasicParsing -TimeoutSec 3
    if($r.StatusCode -ne 200){throw 'HTTP diferente de 200'}
    Write-Output ('Visualizador LAN reutilizado em '+$viewUrl)
  } catch {throw ('Porta 3767 ocupada, mas painel indisponivel: '+$_.Exception.Message)}
}else{
  $node=(Get-Command node.exe -ErrorAction Stop).Source
  $logDir=Join-Path $env:LOCALAPPDATA 'JarvisLANViewer'
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
  $env:JARVIS_LAN_HOST=$lanIp
  $env:JARVIS_LAN_PORT=[string]$port
  $env:JARVIS_PORT=[string]$corePort
  $p=Start-Process -FilePath $node -ArgumentList 'src/lan-viewer.mjs' -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'stdout.log') -RedirectStandardError (Join-Path $logDir 'stderr.log')
  $healthy=$false
  for($i=0;$i -lt 14;$i++){
    Start-Sleep -Milliseconds 300
    try {
      $r=Invoke-WebRequest $viewUrl -UseBasicParsing -TimeoutSec 2
      if($r.StatusCode -eq 200){$healthy=$true;break}
    }catch{}
  }
  if(-not $healthy){throw ('Visualizador nao respondeu apos a inicializacao. PID '+$p.Id+'. Verifique '+$logDir)}
  Write-Output ('Visualizador LAN iniciado em '+$viewUrl+' (PID '+$p.Id+')')
}
Write-Output 'Acesso local: apenas visualizacao. MCP e controles continuam no localhost.'
Start-Process $viewUrl
