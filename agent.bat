@echo off
REM Agent System Runner for Windows (Node.js)
REM Usage: agent.bat <command> [args...]

setlocal enabledelayedexpansion

set AGENTS_DIR=%~dp0.agents
set ORCHESTRATOR_DIR=%AGENTS_DIR%\orchestrator

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js to use the agent system
    exit /b 1
)

REM Install dependencies if package.json is newer than node_modules
if not exist "%ORCHESTRATOR_DIR%\node_modules" (
    echo Installing Node.js dependencies...
    cd /d "%ORCHESTRATOR_DIR%"
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

REM Change to orchestrator directory and run command
cd /d "%ORCHESTRATOR_DIR%"

REM Handle different commands
if "%1"=="list" (
    node cli.js list
    goto :eof
)

if "%1"=="matrix" (
    node cli.js matrix
    goto :eof
)

if "%1"=="install-sql-mcp" (
    echo Installing SQL Server MCP dependencies...
    cd /d "%AGENTS_DIR%\data-agents\sql-mcp"
    call npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install SQL MCP dependencies
        exit /b 1
    )
    echo SQL MCP installed successfully
    goto :eof
)

if "%1"=="gap-analyzer" (
    if "%2"=="" (
        echo Usage: agent.bat gap-analyzer "Analysis query"
        goto :eof
    )
    node cli.js gap-analyzer "%2"
    goto :eof
)

if "%1"=="sql-mcp" (
    if "%2"=="" (
        echo Usage: agent.bat sql-mcp "SQL query"
        goto :eof
    )
    node cli.js sql-mcp "%2"
    goto :eof
)

if "%1"=="consult" (
    if "%4"=="" (
        echo Usage: agent.bat consult requesting-agent target-agent "query"
        goto :eof
    )
    node cli.js consult %2 %3 "%4"
    goto :eof
)

REM Default: Execute agent task
if "%1"=="" (
    goto :show_help
)

if "%2"=="" (
    goto :show_help
)

REM Execute the agent task
node cli.js run %1 "%2"
goto :eof

:show_help
echo.
echo Agent System - Multi-Agent Development Assistant (Node.js)
echo ========================================================
echo.
echo Usage: agent.bat ^<command^> [args...]
echo.
echo Commands:
echo   list                              List all available agents
echo   matrix                            Show agent consultation permissions
echo   install-sql-mcp                   Install SQL MCP dependencies
echo   ^<agent_id^> ^<task^>                Execute task with specific agent
echo   gap-analyzer ^<analysis^>          Run comprehensive gap analysis
echo   sql-mcp ^<query^>                  Execute SQL query through MCP
echo   consult ^<from^> ^<to^> ^<query^>     Have one agent consult another
echo.
echo Available Agents:
echo   frontend-pages                    Regular application pages
echo   table-views                       Data tables and grids
echo   visualizations                    Charts and dashboards  
echo   navigation                        Sidebar and navigation
echo   sql-mcp                           SQL Server access via MCP
echo   transactions                      Data operations and CRUD
echo   auth                              Authentication and security
echo   backend-control                   Admin panels and settings
echo   api-bridge                        REST APIs and data flow
echo   gap-analyzer                      Missing features analysis
echo.
echo Examples:
echo   agent.bat list
echo   agent.bat frontend-pages "Create a user profile page"
echo   agent.bat table-views "Add sorting to the user table"
echo   agent.bat gap-analyzer "What admin features are we missing?"
echo   agent.bat sql-mcp "Show me the user table schema"
echo   agent.bat consult frontend-pages auth "How to implement secure login?"
echo.

:eof