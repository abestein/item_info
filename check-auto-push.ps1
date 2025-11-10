# Check if auto-push is running

Write-Host "Checking for auto-push process..." -ForegroundColor Cyan
Write-Host ""

$processes = Get-Process powershell -ErrorAction SilentlyContinue

if ($processes) {
    Write-Host "PowerShell processes found:" -ForegroundColor Green
    $foundAutoPush = $false

    $processes | ForEach-Object {
        $id = $_.Id
        $startTime = $_.StartTime

        # Try to get command line (requires admin or same user)
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $id").CommandLine
            if ($cmdLine -like "*auto-git-push*") {
                Write-Host "  Auto-push is RUNNING" -ForegroundColor Green
                Write-Host "    PID: $id" -ForegroundColor Gray
                Write-Host "    Started: $startTime" -ForegroundColor Gray
                Write-Host "    Command: $cmdLine" -ForegroundColor Gray
                Write-Host ""
                Write-Host "To stop it:" -ForegroundColor Yellow
                Write-Host "  Stop-Process -Id $id" -ForegroundColor White
                $foundAutoPush = $true
            }
        } catch {
            # Cannot access command line details
        }
    }

    if (-not $foundAutoPush) {
        Write-Host "Auto-push not detected in running PowerShell processes" -ForegroundColor Yellow
        Write-Host "Total PowerShell processes: $($processes.Count)" -ForegroundColor Gray
    }
} else {
    Write-Host "No PowerShell processes found. Auto-push is NOT running." -ForegroundColor Red
}

Write-Host ""
Write-Host "Alternative check - Open Task Manager:" -ForegroundColor Cyan
Write-Host "  1. Press Ctrl+Shift+Esc" -ForegroundColor White
Write-Host "  2. Go to Details tab" -ForegroundColor White
Write-Host "  3. Look for powershell.exe processes" -ForegroundColor White
