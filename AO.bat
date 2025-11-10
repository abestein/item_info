@echo off
REM Enhanced AO Agent - Orchestrates multiple agents with prompt preview
REM Uses the enhanced system that shows prompts before execution

setlocal enabledelayedexpansion

if "%1"=="" (
    echo Usage: AO.bat "your orchestration request"
    echo Example: AO.bat "Import Excel data to SQL with validation and display in dashboard"
    echo.
    echo This enhanced AO agent will:
    echo - Analyze your request and select optimal agents
    echo - Show all prompts before sending to agents
    echo - Display which agent each prompt goes to
    echo - Detect missing capabilities or agents
    echo.
    exit /b 1
)

echo.
echo ========================================================
echo      ENHANCED AO AGENT - Orchestration with Preview
echo ========================================================
echo.

REM Create orchestration plan
node analyze_request.js %*

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
echo               AO ENHANCED ORCHESTRATION COMPLETE
echo ========================================================
echo.