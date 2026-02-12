Set-StrictMode -Version Latest
$ErrorActionPreference = 'SilentlyContinue'

# Get the project root directory (normalize path separators)
$projectRoot = (Split-Path -Parent $PSScriptRoot).Replace('\', '\\')

Write-Host 'Stopping NotesAI SE processes...'

$stoppedCount = 0

# Stop Electron processes that are running from this project
$electronProcs = Get-Process -Name electron -ErrorAction SilentlyContinue
if ($electronProcs) {
    foreach ($proc in $electronProcs) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmdLine -and ($cmdLine -like "*$projectRoot*" -or $cmdLine -like "*notesai-se*")) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                $stoppedCount++
            }
        } catch {
            # Skip if we can't get command line
        }
    }
}

# Stop Node processes that are running vite/electron/npm for this project
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    foreach ($proc in $nodeProcs) {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
            if ($cmdLine) {
                # Check if it's related to this project
                $isProjectProcess = ($cmdLine -like "*$projectRoot*" -or 
                                    $cmdLine -like "*notesai-se*" -or
                                    ($cmdLine -like "*vite*" -and $cmdLine -like "*5173*") -or
                                    ($cmdLine -like "*electron*" -and ($cmdLine -like "*$projectRoot*" -or $cmdLine -like "*notesai-se*")))
                if ($isProjectProcess) {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                    $stoppedCount++
                }
            }
        } catch {
            # Skip if we can't get command line
        }
    }
}

if ($stoppedCount -gt 0) {
    Write-Host "Stopped $stoppedCount NotesAI SE process(es)"
} else {
    Write-Host 'No NotesAI SE processes found running.'
}
