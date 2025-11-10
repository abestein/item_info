# Auto Git Push Script
# Automatically commits and pushes changes every 30 minutes

param(
    [int]$intervalMinutes = 30
)

$repoPath = $PSScriptRoot
Write-Host "Auto Git Push - Monitoring: $repoPath" -ForegroundColor Green
Write-Host "Interval: $intervalMinutes minutes" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

function Auto-CommitAndPush {
    Set-Location $repoPath

    # Check if there are changes
    $status = git status --porcelain

    if ($status) {
        Write-Host "`n[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Changes detected" -ForegroundColor Yellow

        # Show what changed
        git status --short

        # Add all changes
        Write-Host "`nStaging changes..." -ForegroundColor Cyan
        git add -A

        # Create commit with timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = @"
chore: Auto-commit - $timestamp

Auto-saved changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
"@

        Write-Host "Creating commit..." -ForegroundColor Cyan
        git commit -m $commitMessage

        # Push to remote
        Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
        $pushResult = git push origin master 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
        } else {
            Write-Host "Push failed: $pushResult" -ForegroundColor Red
        }
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] No changes detected" -ForegroundColor Gray
    }
}

# Run continuously
while ($true) {
    try {
        Auto-CommitAndPush
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }

    # Wait for specified interval
    $seconds = $intervalMinutes * 60
    Write-Host "`nNext check in $intervalMinutes minutes..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $seconds
}
