# Multi-Agent Development System

A comprehensive 12-agent system for your React + Node.js + SQL Server application, featuring specialized agents with inter-agent communication, SQL MCP integration, and Excel processing capabilities.

## 🏗️ Agent Structure

```
.agents/
├── ui-agents/
│   ├── frontend-pages/        # (1) Regular application pages
│   ├── table-views/           # (2) Data tables and grids  
│   ├── visualizations/        # (3) Charts and dashboards
│   └── navigation/            # (4) Sidebar and navigation
├── data-agents/
│   ├── sql-mcp/              # (5) SQL Server via MCP
│   ├── excel-mcp/            # (6) Excel file processing via MCP
│   └── transactions/          # (7) Data transactions
├── system-agents/
│   ├── auth/                  # (8) Authentication
│   ├── backend-control/       # (9) Admin panels
│   └── api-bridge/           # (10) API endpoints
├── meta-agents/
│   ├── gap-analyzer/          # (11) Gap analysis
│   └── router/               # (12) Intelligent request routing
├── orchestrator/              # General orchestration
└── workflow-orchestrator/     # Multi-step workflow management
```

## 🎯 Agent Responsibilities

### UI Agents
1. **frontend-pages**: Regular application pages (home, about, user profiles, settings)
2. **table-views**: All data tables, grids, list views with sorting/filtering  
3. **visualizations**: Charts, graphs, dashboards, KPI displays
4. **navigation**: Sidebar menus, top ribbon/toolbar, breadcrumbs

### Data Agents  
5. **sql-mcp**: Direct SQL Server access through MCP for queries and schema operations
6. **excel-mcp**: Excel file processing through MCP protocol for spreadsheet operations
7. **transactions**: CRUD operations, batch updates, data integrity, Excel file analysis

### System Agents
8. **auth**: Login, JWT, permissions, role management
9. **backend-control**: Admin panels, settings pages, system config
10. **api-bridge**: REST/GraphQL endpoints, state management, data flow

### Meta Agents
11. **gap-analyzer**: Finds missing features, integration issues, architecture analysis
12. **router**: Intelligent request routing to appropriate specialized agents

### Orchestration Agents
- **orchestrator**: General coordination and task management
- **workflow-orchestrator**: Multi-step workflow planning and execution with user approval

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install SQL MCP dependencies
agent.bat install-sql-mcp

# Or on Mac/Linux
./agent.sh install-sql-mcp
```

### 2. Set Environment Variables

The system uses your existing `.env` file for SQL Server connection. Ensure you have:

```env
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=your_database
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Basic Usage

```bash
# List all available agents
agent.bat list

# Execute a task with a specific agent
agent.bat frontend-pages "Create a user profile page with edit functionality"

# Get comprehensive gap analysis
agent.bat gap-analyzer "Analyze the application for missing admin features"

# Query database through SQL MCP
agent.bat sql-mcp "Show me the schema for the users table"

# Process Excel files through Excel MCP
agent.bat excel-mcp "Analyze the vendor data in the uploaded Excel file"
```

## 🔧 Agent Commands

### Windows (agent.bat)
```bash
# List agents and their capabilities
agent.bat list

# Show consultation matrix (which agents can consult which)
agent.bat matrix

# Execute specific agent tasks
agent.bat frontend-pages "Create login page"
agent.bat table-views "Add user management table"
agent.bat visualizations "Create revenue dashboard"
agent.bat navigation "Add admin menu section"
agent.bat sql-mcp "Query monthly sales data"
agent.bat excel-mcp "Process vendor spreadsheet data"
agent.bat transactions "Implement user CRUD operations"
agent.bat auth "Add two-factor authentication"
agent.bat backend-control "Create system settings page"
agent.bat api-bridge "Design user management API"
agent.bat gap-analyzer "Find missing features"
agent.bat router "Route this request to the best agent"
agent.bat workflow-orchestrator "Plan and execute multi-step workflow"

# Install MCP servers
agent.bat install-sql-mcp
```

### Mac/Linux (agent.sh)
```bash
# Same commands but use ./agent.sh instead
./agent.sh list
./agent.sh frontend-pages "Create login page"
./agent.sh gap-analyzer "Check what we're missing"
```

## ⚡ Shortcut Commands

For frequently used agents, convenient shortcuts are available:

```bash
# Shortcut for SQL MCP agent
SM.bat "Show me all tables with UPC columns"

# Shortcut for Transactions agent  
TX.bat "Process the uploaded Excel file for vendor items"

# Shortcut for Workflow Orchestrator agent
AO.bat "Plan a multi-step user registration workflow"
```

## 🔗 Inter-Agent Communication

Agents can consult each other based on permissions defined in their `config.json`:

### Consultation Matrix
- **frontend-pages** can consult: navigation, auth, api-bridge, table-views
- **table-views** can consult: api-bridge, sql-mcp, visualizations, frontend-pages  
- **visualizations** can consult: api-bridge, sql-mcp, table-views, frontend-pages
- **navigation** can consult: auth, frontend-pages, api-bridge, backend-control
- **sql-mcp** can consult: transactions, gap-analyzer
- **excel-mcp** can consult: transactions, sql-mcp, gap-analyzer
- **transactions** can consult: sql-mcp, excel-mcp, auth, api-bridge, gap-analyzer
- **auth** can consult: api-bridge, frontend-pages, navigation, transactions
- **backend-control** can consult: auth, table-views, api-bridge, transactions
- **api-bridge** can consult: auth, transactions, frontend-pages, sql-mcp
- **gap-analyzer** can consult: ALL agents (and be consulted by all)
- **router** can route to: ALL agents based on request analysis

## 🗄️ SQL MCP Integration

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sql-server-mcp": {
      "command": "node",
      "args": [".agents/data-agents/sql-mcp/index.js"],
      "cwd": "C:/Users/A.Stein/Source/Repos/item_info",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### MCP Server Capabilities

The SQL MCP server provides:
- `execute_query`: Run SELECT queries with parameters
- `execute_command`: Run INSERT/UPDATE/DELETE commands
- `execute_transaction`: Multi-command transactions
- `get_table_schema`: Get table structure and relationships  
- `list_tables`: List all database tables
- `get_table_data`: Get sample data with filtering
- `execute_stored_procedure`: Run stored procedures
- `get_query_plan`: Analyze query performance

## 📊 Excel MCP Integration

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "excel-server-mcp": {
      "command": "node",
      "args": [".agents/data-agents/excel-mcp/index.js"],
      "cwd": "C:/Users/A.Stein/Source/Repos/item_info",
      "env": {
        "NODE_ENV": "production",
        "EXCEL_TEMP_DIR": "./uploads/temp",
        "MAX_FILE_SIZE": "50MB"
      }
    }
  }
}
```

### Excel MCP Capabilities

The Excel MCP server provides:
- Read Excel workbooks and worksheets
- Extract data from specific ranges
- Validate Excel file structure
- Convert Excel to JSON/CSV formats
- Generate Excel reports from data
- Handle multiple worksheet operations
- Process Excel formulas and calculations
- Manage Excel file metadata

### Supported Formats
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)
- `.csv` (Comma Separated Values)
- `.tsv` (Tab Separated Values)

### Usage Examples

```bash
# Basic Excel operations
agent.bat excel-mcp "Read the vendor data from sheet1 of the uploaded file"
agent.bat excel-mcp "Convert the Excel file to JSON format"
agent.bat excel-mcp "Validate the structure of the imported spreadsheet"

# Complex analysis
agent.bat excel-mcp "Extract UPC codes from column B and validate format"
agent.bat excel-mcp "Generate a summary report of the vendor items data"
```

## 📁 File Patterns

Each agent monitors specific file patterns:

### UI Agents
- **frontend-pages**: `client/src/pages/**/*.tsx`, `client/src/components/**/Page*.tsx`
- **table-views**: `client/src/components/**/Table*.tsx`, `client/src/components/**/Grid*.tsx`
- **visualizations**: `client/src/components/**/Chart*.tsx`, `client/src/pages/**/Dashboard*.tsx`
- **navigation**: `client/src/components/**/Nav*.tsx`, `client/src/App.tsx`

### Data Agents
- **sql-mcp**: `*.sql`, `database/**/*`
- **excel-mcp**: `**/*.xlsx`, `**/*.xls`, `**/*.csv`, `uploads/**/*`, `helpers/**/*Excel*.js`
- **transactions**: `helpers/**/*Handler.js`, `routes/**/*.js`

### System Agents  
- **auth**: `middleware/auth.js`, `client/src/services/authService.ts`
- **backend-control**: `routes/admin*.js`, `client/src/pages/**/Admin*.tsx`
- **api-bridge**: `app.js`, `routes/**/*.js`, `client/src/services/**/*.ts`

### Meta Agents
- **gap-analyzer**: `**/*` (all files for comprehensive analysis)
- **router**: `.agents/**/config.json`, `app.js`, `routes/**/*.js`

## 🤖 Intelligent Request Routing

The **router** agent analyzes user requests and automatically routes them to the most appropriate specialized agent:

### Routing Rules
- **SQL operations**: Keywords like "database", "sql", "query", "table" → `sql-mcp`
- **Excel operations**: Keywords like "excel", "spreadsheet", "xlsx", "csv" → `excel-mcp`
- **Data analysis**: Keywords like "analyze", "report", "chart", "dashboard" → `gap-analyzer`
- **Transaction processing**: Keywords like "transaction", "payment", "process" → `transactions`
- **General tasks**: Keywords like "help", "create", "build" → `orchestrator`

### Usage
```bash
# Router automatically selects the best agent
agent.bat router "I need to analyze the sales data in the Excel file"
# → Routes to excel-mcp agent

agent.bat router "Create a new user management table with proper indexes"
# → Routes to sql-mcp agent
```

## 🎯 Example Workflows

### 1. Create New Feature
```bash
# Start with gap analysis
agent.bat gap-analyzer "What's missing for user profile management?"

# Design the API
agent.bat api-bridge "Design REST endpoints for user profiles"

# Create the database structure  
agent.bat sql-mcp "Design user_profiles table schema"

# Implement backend
agent.bat transactions "Create user profile CRUD operations"

# Build the UI
agent.bat frontend-pages "Create user profile page"
agent.bat table-views "Add user profile data table"

# Add navigation
agent.bat navigation "Add profile link to user menu"

# Secure it
agent.bat auth "Add profile edit permissions"
```

### 2. Process Excel Data Workflow
```bash
# Use workflow orchestrator for complex multi-step process
AO.bat "Create a workflow to import vendor data from Excel, validate it, and update the database"

# Or step by step
agent.bat excel-mcp "Analyze the uploaded vendor Excel file structure"
agent.bat excel-mcp "Extract and validate vendor data from the spreadsheet"
agent.bat transactions "Import the validated vendor data into the database"
agent.bat gap-analyzer "Verify the data import was successful and complete"
```

### 3. Debug Performance Issue
```bash
# Analyze the problem
agent.bat gap-analyzer "Find performance bottlenecks in the application"

# Check database performance
agent.bat sql-mcp "Analyze slow queries and missing indexes"

# Optimize data operations
agent.bat transactions "Optimize bulk data processing"

# Improve API performance
agent.bat api-bridge "Add caching and optimize response times"

# Update UI for better performance
agent.bat table-views "Add virtualization for large datasets"
```

### 4. Add Admin Feature
```bash
# Plan the admin feature
agent.bat gap-analyzer "What admin features are we missing?"

# Create admin backend
agent.bat backend-control "Create system settings management"

# Add admin UI
agent.bat frontend-pages "Create admin dashboard"
agent.bat table-views "Add admin user management table"

# Secure admin access
agent.bat auth "Implement admin role verification"

# Update navigation
agent.bat navigation "Add admin menu section"
```

## 🔍 Advanced Features

### Multi-Agent Consultation

Agents automatically consult each other when needed:

```python
# Example: frontend-pages agent consulting auth agent
request = ConsultationRequest(
    requesting_agent="frontend-pages",
    target_agent="auth", 
    query="How should I implement a secure login form?",
    context={"component": "LoginPage", "framework": "React + Ant Design"}
)

response = await system.consult_agent(request)
```

### Gap Analysis

The gap-analyzer agent provides comprehensive analysis:

```bash
# Find missing features
agent.bat gap-analyzer "What features are missing for a complete admin panel?"

# Check integration issues  
agent.bat gap-analyzer "Are there any broken integrations between frontend and backend?"

# Security assessment
agent.bat gap-analyzer "What security improvements does the application need?"

# Performance analysis
agent.bat gap-analyzer "What performance optimizations should we implement?"
```

### Workflow Orchestration

The workflow-orchestrator agent helps plan and execute complex multi-step tasks:

```bash
# Plan complex workflows
AO.bat "Plan a complete user registration workflow with email verification"

# Multi-agent coordination
AO.bat "Create a workflow to migrate legacy data, update schema, and test everything"
```

## 🛠️ Customization

### Adding New Agents

1. Create directory structure:
```bash
mkdir -p .agents/your-category/your-agent
```

2. Create `.claude-code` configuration:
```json
{
  "model": "claude-sonnet-4-20241022",
  "name": "Your Agent Name",
  "description": "What your agent does",
  "systemPrompt": "Your agent's expertise and context...",
  "include": ["file/patterns/**/*"],
  "exclude": ["excluded/patterns/**/*"]
}
```

3. Create `config.json`:
```json
{
  "name": "Your Agent Name",
  "type": "your-category-agent",
  "expertise": ["skill1", "skill2"],
  "responsibilities": ["task1", "task2"],
  "consultationPermissions": {
    "canConsult": ["other-agent-ids"],
    "canBeConsultedBy": ["other-agent-ids"]
  }
}
```

4. Update `agent_system.py` to include your new agent.

### Modifying Consultation Permissions

Edit the `consultationPermissions` in each agent's `config.json`:

```json
{
  "consultationPermissions": {
    "canConsult": ["auth", "api-bridge"],
    "canBeConsultedBy": ["frontend-pages", "gap-analyzer"]
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Python not found**: Install Python 3.8+ and ensure it's in PATH
2. **Dependencies fail**: Run `pip install -r .agents/orchestrator/requirements.txt` manually
3. **SQL MCP not working**: Check your `.env` file has correct database credentials
4. **Excel MCP not working**: Verify file permissions and temp directory access
5. **Agent not found**: Run `agent.bat list` to see available agents
6. **Shortcut not working**: Ensure `agent.bat` is in the same directory as shortcuts

### Debug Mode

For detailed debugging, edit the agent scripts and add verbose output:

```python
# In agent_system.py, add debug prints
print(f"Executing task: {task}")
print(f"Agent response: {response.content[0].text[:200]}...")
```

## 📚 Integration Examples

### With Your Existing Code

The agent system is designed to work with your current codebase:

- **React Components**: Agents understand your Ant Design + TypeScript setup
- **Express API**: Agents know your route structure and middleware
- **SQL Server**: Direct database access through MCP
- **Excel Processing**: Automated spreadsheet analysis and data extraction
- **Authentication**: Agents respect your JWT implementation
- **File Uploads**: Agents understand your Excel processing workflow

### Development Workflow

1. **Planning**: Use `gap-analyzer` to identify what needs to be built
2. **Routing**: Use `router` to automatically select the right agent
3. **Design**: Use `api-bridge` and `sql-mcp` to design data flow
4. **Backend**: Use `transactions` and `auth` for server-side implementation
5. **Frontend**: Use `frontend-pages`, `table-views`, `visualizations` for UI
6. **Integration**: Use `navigation` and `api-bridge` to connect everything
7. **Admin**: Use `backend-control` for administrative features
8. **Excel**: Use `excel-mcp` for spreadsheet processing
9. **Orchestration**: Use `workflow-orchestrator` for complex multi-step tasks
10. **Validation**: Use `gap-analyzer` to ensure nothing is missing

## 🔐 Security Notes

- Agents respect your existing authentication system
- SQL MCP uses your existing database credentials
- Excel MCP processes files in secure temporary directories
- No sensitive data is logged or stored by the agent system
- Inter-agent communication is local and secure
- All database operations go through your established connection patterns
- File uploads are validated and sandboxed

## 📈 Performance

- Agents run on-demand, no background processes
- SQL MCP uses connection pooling for efficiency  
- Excel MCP processes files in optimized chunks
- Inter-agent consultation is asynchronous and parallel-capable
- File pattern matching is optimized for large codebases
- Gap analysis can be cached and incremental
- Router provides efficient request distribution

---

**Ready to use your agent system!** Start with `agent.bat list` to see all available agents, or use shortcuts like `SM.bat` (SQL), `TX.bat` (Transactions), and `AO.bat` (Workflow Orchestrator) for quick access to frequently used agents.