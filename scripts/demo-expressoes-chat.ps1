# Demonstra expressões no JARVIS em execução. Somente loopback; sem elevar privilégios.
$ErrorActionPreference = 'Stop'
$endpoint = 'http://127.0.0.1:3766/api/manual'
$headers = @{ 'X-Jarvis-UI' = '1' }
foreach ($emotion in @('thinking', 'happy', 'alert', 'surprised')) {
  $json = @{ action = 'set_expression'; value = $emotion } | ConvertTo-Json -Compress
  $result = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $json -TimeoutSec 4
  if (-not $result.ok -or $result.state.expression -ne $emotion) { throw "Nao confirmou expressao: $emotion" }
  Write-Output "EXIBINDO: $emotion | modo: $($result.state.mode) | sessao: $($result.state.voiceSession)"
  Start-Sleep -Seconds 3
}
$json = @{ action = 'set_expression'; value = 'listening' } | ConvertTo-Json -Compress
$result = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -ContentType 'application/json' -Body $json -TimeoutSec 4
Write-Output "TESTE CONCLUIDO: $($result.state.expression)"
