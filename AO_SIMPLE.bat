@echo off
REM Simple AO Agent for testing
REM Usage: AO_SIMPLE.bat "your request"

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: AO_SIMPLE.bat "your request"
    echo Example: AO_SIMPLE.bat "Import Excel data to SQL with validation"
    exit /b 1
)

echo.
echo ========================================================
echo      ENHANCED AO AGENT - Orchestration with Preview
echo ========================================================
echo.
echo Your Request: %1
echo.

REM Create orchestration plan using separate script
node analyze_request.js %1

echo.
echo ========================================================
echo                  EXECUTION CONFIRMATION
echo ========================================================
echo.

set /p confirm="Do you want to execute this orchestration plan? (y/n): "
if /i "%confirm%"=="y" (
    echo.
    echo ✅ Executing orchestration plan...
    echo.
    node execute_plan.js
) else (
    echo.
    echo ❌ Execution cancelled. Plan saved for review.
)

echo.
echo ========================================================
echo               AO SIMPLE ORCHESTRATION COMPLETE
echo ========================================================
echo.

:eof