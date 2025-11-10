# Agent Shortcuts for Quick Access
# Usage: Import this file in your PowerShell profile or run it in your session

# Workflow Orchestrator Agent
function AO { param([string]$task) & ".\agent.bat" "workflow-orchestrator" $task }

# UI Agents
function FP { param([string]$task) & ".\agent.bat" "frontend-pages" $task }      # Frontend Pages
function TV { param([string]$task) & ".\agent.bat" "table-views" $task }        # Table Views  
function VZ { param([string]$task) & ".\agent.bat" "visualizations" $task }     # Visualizations
function NV { param([string]$task) & ".\agent.bat" "navigation" $task }         # Navigation

# Data Agents
function SM { param([string]$task) & ".\agent.bat" "sql-mcp" $task }            # SQL MCP
function TX { param([string]$task) & ".\agent.bat" "transactions" $task }       # Transactions

# System Agents  
function AU { param([string]$task) & ".\agent.bat" "auth" $task }               # Authentication
function BC { param([string]$task) & ".\agent.bat" "backend-control" $task }    # Backend Control
function AB { param([string]$task) & ".\agent.bat" "api-bridge" $task }         # API Bridge

# Meta Agents
function GA { param([string]$task) & ".\agent.bat" "gap-analyzer" $task }       # Gap Analyzer
function OR { param([string]$task) & ".\agent.bat" "orchestrator" $task }       # Orchestrator (original)
function RT { param([string]$task) & ".\agent.bat" "router" $task }             # Router

Write-Host "Agent shortcuts loaded! Available commands:" -ForegroundColor Green
Write-Host "AO  - Workflow Orchestrator  |  FP - Frontend Pages    |  TV - Table Views" -ForegroundColor Yellow
Write-Host "VZ  - Visualizations         |  NV - Navigation        |  SM - SQL MCP" -ForegroundColor Yellow  
Write-Host "TX  - Transactions           |  AU - Authentication    |  BC - Backend Control" -ForegroundColor Yellow
Write-Host "AB  - API Bridge             |  GA - Gap Analyzer      |  OR - Orchestrator" -ForegroundColor Yellow
Write-Host "RT  - Router" -ForegroundColor Yellow
Write-Host ""
Write-Host "Usage: AO 'analyze this Excel file and create SQL table'" -ForegroundColor Cyan