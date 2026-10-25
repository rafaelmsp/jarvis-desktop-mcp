# JARVIS — comando MCP local para a sessão conversacional.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\jarvis-voice.ps1 -Mode turn -Seconds 12
# Não grava, reproduz ou lê áudio; apenas atualiza expressões visuais do avatar.
param(
  [ValidateSet('on','off','turn','status')]
  [string]$Mode='status',
  [ValidateRange(1,60)]
  [double]$Seconds=12,
  [ValidateRange(1024,65535)]
  [int]$Port=3766
)
$ErrorActionPreference='Stop'
$url="http://127.0.0.1:$Port"
try {
  if ($Mode -eq 'status') {
    $state=Invoke-RestMethod -Uri "$url/api/state" -TimeoutSec 4
  } else {
    $suffix=if ($Port -eq 3765) {''} else {"-$Port"}
    $tokenPath=Join-Path $HOME ".jarvis-desktop-mcp-token$suffix"
    if (-not (Test-Path -LiteralPath $tokenPath)) {
      throw "Token local da porta $Port nao encontrado. Inicie o painel."
    }
    $token=(Get-Content -LiteralPath $tokenPath -Raw).Trim()
    $action=if ($Mode -eq 'turn') {'voice_turn'} else {'set_voice_session'}
    $value=if ($Mode -eq 'turn') {[double]$Seconds} else {$Mode -eq 'on'}
    $body=@{action=$action; value=$value} | ConvertTo-Json -Compress
    $response=Invoke-RestMethod -Uri "$url/api/control" -Method Post -ContentType 'application/json' -Headers @{'X-Jarvis-Token'=$token} -Body $body -TimeoutSec 4
    $state=$response.state
  }
  [pscustomobject]@{
    ok=$true
    port=$Port
    mode=$Mode
    visualSession=[bool]$state.voiceSession
    status=$state.status
    expression=$state.expression
    speaking=[bool]$state.speaking
    caption=$state.caption
    estimateSeconds=if ($Mode -eq 'turn') {$Seconds} else {$null}
  } | ConvertTo-Json -Compress
} catch {
  [pscustomobject]@{ok=$false; mode=$Mode; error=$_.Exception.Message} | ConvertTo-Json -Compress
  exit 1
}
