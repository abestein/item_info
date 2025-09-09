#!/bin/bash
# Agent System Runner for Mac/Linux
# Usage: ./agent.sh <agent_id> <task>
# Example: ./agent.sh frontend-pages "Create a user profile page"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$SCRIPT_DIR/.agents"
ORCHESTRATOR_DIR="$AGENTS_DIR/orchestrator"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8+ to use the agent system"
    exit 1
fi

# Check if virtual environment exists, create if not
if [ ! -d "$ORCHESTRATOR_DIR/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$ORCHESTRATOR_DIR/venv"
fi

# Activate virtual environment
source "$ORCHESTRATOR_DIR/venv/bin/activate"

# Install dependencies if requirements.txt is newer than the last install
if [ ! -f "$ORCHESTRATOR_DIR/venv/.installed" ]; then
    echo "Installing Python dependencies..."
    pip install -r "$ORCHESTRATOR_DIR/requirements.txt"
    touch "$ORCHESTRATOR_DIR/venv/.installed"
fi

# Change to orchestrator directory
cd "$ORCHESTRATOR_DIR"

# Handle different commands
case "$1" in
    "list")
        python3 -c "
import asyncio
from agent_system import AgentSystem

async def main():
    system = AgentSystem()
    print('\\nAvailable Agents:')
    print('================')
    for agent_id, agent_info in system.list_agents().items():
        print(f'{agent_id:15} - {agent_info.name}')
        print(f'{'':15}   {agent_info.description}')
        print()

asyncio.run(main())
"
        ;;
    
    "matrix")
        python3 -c "
import asyncio
from agent_system import AgentSystem

async def main():
    system = AgentSystem()
    print('\\nConsultation Matrix:')
    print('===================')
    matrix = system.get_consultation_matrix()
    for agent_id, can_consult in matrix.items():
        consultable = ', '.join(can_consult) if can_consult else 'none'
        print(f'{agent_id:15} can consult: {consultable}')

asyncio.run(main())
"
        ;;
    
    "install-sql-mcp")
        echo "Installing SQL Server MCP dependencies..."
        cd "$AGENTS_DIR/data-agents/sql-mcp"
        npm install
        echo "SQL MCP installed successfully"
        ;;
    
    "gap-analyzer")
        if [ -z "$2" ]; then
            echo "Usage: ./agent.sh gap-analyzer \"Analyze the application for missing features\""
            exit 1
        fi
        python3 -c "
import asyncio
from agent_system import AgentSystem

async def main():
    system = AgentSystem()
    result = await system.execute_agent_task('gap-analyzer', '$2')
    
    if result.get('success'):
        print('\\n=== Gap Analysis Results ===')
        print(result['response'])
    else:
        print(f'Error: {result.get(\"error\", \"Unknown error\")}')

asyncio.run(main())
"
        ;;
    
    "sql-mcp")
        if [ -z "$2" ]; then
            echo "Usage: ./agent.sh sql-mcp \"Query to execute\""
            echo "Example: ./agent.sh sql-mcp \"List all tables in the database\""
            exit 1
        fi
        python3 -c "
import asyncio
from agent_system import AgentSystem

async def main():
    system = AgentSystem()
    result = await system.execute_agent_task('sql-mcp', '$2')
    
    if result.get('success'):
        print('\\n=== SQL MCP Response ===')
        print(result['response'])
    else:
        print(f'Error: {result.get(\"error\", \"Unknown error\")}')

asyncio.run(main())
"
        ;;
    
    "help"|"--help"|"-h"|"")
        cat << EOF

Agent System - Multi-Agent Development Assistant
===============================================

Usage: ./agent.sh <command> [args...]

Commands:
  list                          List all available agents
  matrix                        Show agent consultation permissions
  install-sql-mcp              Install SQL MCP dependencies
  <agent_id> <task>            Execute task with specific agent
  gap-analyzer <analysis>      Run comprehensive gap analysis
  sql-mcp <query>              Execute SQL query through MCP

Available Agents:
  frontend-pages               Regular application pages
  table-views                  Data tables and grids
  visualizations               Charts and dashboards  
  navigation                   Sidebar and navigation
  sql-mcp                      SQL Server access via MCP
  transactions                 Data operations and CRUD
  auth                         Authentication and security
  backend-control              Admin panels and settings
  api-bridge                   REST APIs and data flow
  gap-analyzer                 Missing features analysis

Examples:
  ./agent.sh list
  ./agent.sh frontend-pages "Create a user profile page"
  ./agent.sh table-views "Add sorting to the user table"
  ./agent.sh gap-analyzer "Find missing admin features"
  ./agent.sh sql-mcp "Show me the user table schema"

EOF
        ;;
    
    *)
        # Default: Execute agent task
        if [ -z "$2" ]; then
            echo "Usage: ./agent.sh <agent_id> <task>"
            echo "Run './agent.sh help' for more information"
            exit 1
        fi
        
        python3 -c "
import asyncio
from agent_system import AgentSystem

async def main():
    system = AgentSystem()
    
    # Check if agent exists
    if '$1' not in system.list_agents():
        print(f'Error: Agent \"$1\" not found')
        print('\\nAvailable agents:')
        for agent_id in system.list_agents().keys():
            print(f'  {agent_id}')
        return
    
    print(f'Executing task with {system.get_agent_info(\"$1\").name}...')
    result = await system.execute_agent_task('$1', '$2')
    
    if result.get('success'):
        print(f'\\n=== {result[\"agent\"]} Response ===')
        print(result['response'])
    else:
        print(f'\\nError: {result.get(\"error\", \"Unknown error\")}')

asyncio.run(main())
"
        ;;
esac