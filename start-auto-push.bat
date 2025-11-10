@echo off
REM Start Auto Git Push in background
echo Starting Auto Git Push (every 30 minutes)...
powershell -ExecutionPolicy Bypass -File "%~dp0auto-git-push.ps1"
