Set-StrictMode -Version Latest
$ErrorActionPreference = 'SilentlyContinue'

Write-Host 'Stopping Electron and Node processes...'
taskkill /F /IM electron.exe /IM node.exe | Out-Null
