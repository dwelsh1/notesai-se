param(
  [switch]$Rebuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Rebuild) {
  Write-Host 'Rebuilding native modules for Electron...'
  npm run rebuild:electron
}

Write-Host 'Starting Electron desktop app...'
npm run dev:electron
