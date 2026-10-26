# Ativa expressao visivel no painel local sem alterar o audio nem o Windows.
param([ValidateSet('neutral','happy','thinking','alert','surprised','listening','speaking')][string]$Expression = 'surprised')
$ErrorActionPreference = 'Stop'
$body = @{ action = 'set_expression'; value = $Expression } | ConvertTo-Json -Compress
$result = Invoke-RestMethod -Uri 'http://127.0.0.1:3766/api/manual' -Method Post -Headers @{ 'X-Jarvis-UI' = '1' } -ContentType 'application/json' -Body $body -TimeoutSec 4
if (-not $result.ok -or $result.state.expression -ne $Expression) { throw "Falha ao aplicar $Expression" }
Write-Output "JARVIS: expressao=$($result.state.expression); humor=$($result.state.mood); modo=$($result.state.mode); visual=$($result.state.voiceSession)"
