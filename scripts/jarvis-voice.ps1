# JARVIS — comando MCP local para a sessão conversacional.
# Uso celular: -Mode turn -Seconds 12 [-EndLeadMs 250].
# Comeca visualmente sem etapa de pensamento e termina um pouco antes da duracao estimada.
# Para interromper a boca imediatamente e manter a sessao: -Mode listen.
# Compatibilidade: -Mode legacy_turn conserva a fase antiga de pensamento.
# Não grava, reproduz ou lê áudio; apenas atualiza expressões visuais do avatar.
param(
  [ValidateSet('on','off','turn','instant','listen','legacy_turn','status')]
  [string]$Mode='status',
  [ValidateRange(1,60)]
  [double]$Seconds=12,
  [ValidateRange(0,1500)]
  [int]$EndLeadMs=250,
  [ValidateRange(0,1000)]
  [int]$WordCount=0,
  [ValidateRange(100,240)]
  [int]$WordsPerMinute=155,
  [ValidateRange(1024,65535)]
  [int]$Port=3766
)
$ErrorActionPreference='Stop'
$url="http://127.0.0.1:$Port"
# Duracao estimada por palavras, sem transmitir texto ou gravar audio.
$spokenSeconds=if ($WordCount -gt 0) {[Math]::Round([Math]::Min(60.0,[Math]::Max(1.0,60.0*$WordCount/$WordsPerMinute)),3)} else {[double]$Seconds}
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
    $action=if ($Mode -eq 'legacy_turn') {'voice_turn'} elseif ($Mode -in @('turn','instant')) {'animate_reply'} else {'set_voice_session'}
    $value=if ($Mode -in @('turn','instant')) {[Math]::Max(1.0,[Math]::Round($spokenSeconds - ($EndLeadMs / 1000.0),3))} elseif ($Mode -eq 'legacy_turn') {[double]$spokenSeconds} else {$Mode -in @('on','listen')}
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
    estimateSeconds=if ($Mode -in @('turn','instant','legacy_turn')) {$spokenSeconds} else {$null}
    wordCount=if ($Mode -in @('turn','instant','legacy_turn')) {$WordCount} else {$null}
    animationSeconds=if ($Mode -in @('turn','instant','legacy_turn')) {$value} else {$null}
    endLeadMs=if ($Mode -in @('turn','instant')) {$EndLeadMs} else {$null}
  } | ConvertTo-Json -Compress
} catch {
  [pscustomobject]@{ok=$false; mode=$Mode; error=$_.Exception.Message} | ConvertTo-Json -Compress
  exit 1
}
