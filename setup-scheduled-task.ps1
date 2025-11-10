# Setup Windows Task Scheduler for Auto Git Push
# This will create a scheduled task that runs on startup

param(
    [string]$taskName = "ItemInfo-AutoGitPush"
)

$scriptPath = Join-Path $PSScriptRoot "auto-git-push.ps1"
$repoPath = $PSScriptRoot

# Create the action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`"" `
    -WorkingDirectory $repoPath

# Create the trigger (runs at startup and then stays running)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Set the principal to run whether user is logged on or not
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Limited

# Create the settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

# Register the task
try {
    # Remove existing task if it exists
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    # Register new task
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Auto-commits and pushes changes to GitHub every 30 minutes for item_info project"

    Write-Host "Scheduled task '$taskName' created successfully!" -ForegroundColor Green
    Write-Host "`nThe task will:" -ForegroundColor Cyan
    Write-Host "  - Start automatically when Windows starts"
    Write-Host "  - Run in the background"
    Write-Host "  - Check for changes every 30 minutes"
    Write-Host "  - Auto-commit and push when changes are detected"
    Write-Host "`nTo manage the task:"
    Write-Host "  - Open Task Scheduler (taskschd.msc)"
    Write-Host "  - Look for '$taskName' in the Task Scheduler Library"
    Write-Host "`nTo start now:"
    Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor Yellow
    Write-Host "`nTo stop:"
    Write-Host "  Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor Yellow
    Write-Host "`nTo remove:"
    Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Yellow
} catch {
    Write-Host "Error creating scheduled task: $_" -ForegroundColor Red
    Write-Host "`nYou may need to run this script as Administrator" -ForegroundColor Yellow
}
