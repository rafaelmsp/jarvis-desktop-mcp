# JARVIS — excecao estrita para visualizacao LAN.
# Executar somente com elevacao UAC. Preserva regras preexistentes.
param([switch]$Apply,[switch]$Rollback)
$ErrorActionPreference='Stop'
$ruleName='JARVIS-LAN-Visualizacao-3767'
$statePath=Join-Path $PSScriptRoot 'jarvis-firewall-state.json'
$resultPath=Join-Path $env:LOCALAPPDATA 'JarvisLANViewer\firewall-status.txt'
New-Item -ItemType Directory -Force (Split-Path $resultPath) | Out-Null
function save($message){Set-Content -LiteralPath $resultPath -Value $message -Encoding UTF8;Write-Output $message}
$admin=[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if(-not $admin){save 'ERRO: privilegios de administrador necessarios';exit 1}
try {
  if($Rollback){
    if(-not (Test-Path $statePath)){throw 'Registro de estado nao encontrado'}
    $old=Get-Content $statePath -Raw | ConvertFrom-Json
    if($old.createdRule){Remove-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue}
    Set-NetFirewallProfile -Name Private -Enabled ([bool]$old.wasPrivateEnabled)
    save 'REVERTIDO: perfil Privado restaurado e regra JARVIS removida quando criada'
    exit 0
  }
  if(-not $Apply){throw 'Informe -Apply ou -Rollback'}
  $conn=Get-NetConnectionProfile -InterfaceAlias 'Ethernet'
  if($conn.NetworkCategory -ne 'Private'){throw 'Interface Ethernet nao esta marcada como rede Privada'}
  $ip=Get-NetIPAddress -InterfaceAlias 'Ethernet' -AddressFamily IPv4|Where-Object {$_.IPAddress -match '^192\.168\.' -and $_.AddressState -eq 'Preferred'}|Select-Object -First 1
  if(-not $ip){throw 'IPv4 privado da Ethernet nao encontrado'}
  $existing=Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue
  if($existing){
    $f=$existing|Get-NetFirewallPortFilter
    if($f.LocalPort -ne '3767' -or $f.Protocol -ne 'TCP' -or $existing.Action -ne 'Allow'){throw 'Regra conflitante encontrada, nenhum ajuste feito'}
  }
  $before=Get-NetFirewallProfile -Name Private
  if(-not (Test-Path $statePath)){@{wasPrivateEnabled=[bool]$before.Enabled;createdRule=($null -eq $existing)}|ConvertTo-Json|Set-Content -LiteralPath $statePath -Encoding UTF8}
  if(-not $existing){
    New-NetFirewallRule -Name $ruleName -DisplayName 'JARVIS — visualizador LAN TCP 3767' -Enabled True -Direction Inbound -Action Allow -Profile Private -Protocol TCP -LocalPort 3767 -RemoteAddress LocalSubnet -InterfaceAlias 'Ethernet' -EdgeTraversalPolicy Block | Out-Null
  }
  Set-NetFirewallProfile -Name Private -Enabled True
  $rule=Get-NetFirewallRule -Name $ruleName
  $profile=Get-NetFirewallProfile -Name Private
  if(-not $profile.Enabled -or -not $rule.Enabled){throw 'Regra ou perfil nao ativos'}
  save "OK: firewall Privado ON; JARVIS TCP 3767 permitido somente Ethernet/LocalSubnet. IP atual $($ip.IPAddress)"
} catch {
  save ('ERRO: '+$_.Exception.Message)
  exit 1
}
