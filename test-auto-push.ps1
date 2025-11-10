# Test Auto Git Push Script (runs once)

$repoPath = $PSScriptRoot
Set-Location $repoPath

Write-Host "Testing Auto Git Push..." -ForegroundColor Green
Write-Host "Repository: $repoPath" -ForegroundColor Cyan
Write-Host ""

# Check if there are changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host ""
    Write-Host "Changes detected:" -ForegroundColor Green
    git status --short | Select-Object -First 10
    $totalChanges = ($status | Measure-Object).Count
    if ($totalChanges -gt 10) {
        Write-Host "... and $($totalChanges - 10) more files" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "--- TEST MODE: Would perform these actions ---" -ForegroundColor Cyan
    Write-Host "1. git add -A" -ForegroundColor White
    Write-Host "2. git commit -m 'chore: Auto-commit - [timestamp]'" -ForegroundColor White
    Write-Host "3. git push origin master" -ForegroundColor White
    Write-Host ""

    Write-Host "Do you want to proceed with the actual commit and push? (Y/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host

    if ($response -eq 'Y' -or $response -eq 'y') {
        # Add all changes
        Write-Host ""
        Write-Host "Staging changes..." -ForegroundColor Cyan
        git add -A

        # Create commit with timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "chore: Auto-commit - $timestamp`n`nAuto-saved changes`n`n🤖 Generated with [Claude Code](https://claude.com/claude-code)`n`nCo-Authored-By: Claude <noreply@anthropic.com>"

        Write-Host "Creating commit..." -ForegroundColor Cyan
        git commit -m $commitMessage

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Commit successful!" -ForegroundColor Green
            Write-Host ""

            # Push to remote
            Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
            git push origin master

            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Test completed successfully! The auto-push script is working." -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "Push failed!" -ForegroundColor Red
                Write-Host "Check your network connection and git credentials." -ForegroundColor Yellow
            }
        } else {
            Write-Host ""
            Write-Host "Commit failed!" -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "Test cancelled. No changes were committed." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "No changes detected." -ForegroundColor Gray
    Write-Host "The script would do nothing in this case." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Green
