# Reverter apenas as alteracoes deste projeto, com aprovacao UAC.
Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"' + (Join-Path $PSScriptRoot 'apply-jarvis-firewall.ps1') + '"'),'-Rollback')
