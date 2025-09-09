# Multi-Agent Development System

A comprehensive 10-agent system for your React + Node.js + SQL Server application, featuring specialized agents with inter-agent communication and SQL MCP integration.

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
│   └── transactions/          # (8) Data transactions
├── system-agents/
│   ├── auth/                  # (6) Authentication
│   ├── backend-control/       # (7) Admin panels
│   └── api-bridge/           # (9) API endpoints
└── meta-agents/
    └── gap-analyzer/          # (10) Gap analysis
```

## 🎯 Agent Responsibilities

### UI Agents
1. **frontend-pages**: Regular application pages (home, about, user profiles, settings)
2. **table-views**: All data tables, grids, list views with sorting/filtering  
3. **visualizations**: Charts, graphs, dashboards, KPI displays
4. **navigation**: Sidebar menus, top ribbon/toolbar, breadcrumbs

### Data Agents  
5. **sql-mcp**: Direct SQL Server access through MCP for queries
8. **transactions**: CRUD operations, batch updates, data integrity

### System Agents
6. **auth**: Login, JWT, permissions, role management
7. **backend-control**: Admin panels, settings pages, system config
9. **api-bridge**: REST/GraphQL endpoints, state management, data flow

### Meta Agents
10. **gap-analyzer**: Finds missing features, integration issues

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
agent.bat transactions "Implement user CRUD operations"
agent.bat auth "Add two-factor authentication"
agent.bat backend-control "Create system settings page"
agent.bat api-bridge "Design user management API"
agent.bat gap-analyzer "Find missing features"

# Install SQL MCP server
agent.bat install-sql-mcp
```

### Mac/Linux (agent.sh)
```bash
# Same commands but use ./agent.sh instead
./agent.sh list
./agent.sh frontend-pages "Create login page"
./agent.sh gap-analyzer "Check what we're missing"
```

## 🔗 Inter-Agent Communication

Agents can consult each other based on permissions defined in their `config.json`:

### Consultation Matrix
- **frontend-pages** can consult: navigation, auth, api-bridge, table-views
- **table-views** can consult: api-bridge, sql-mcp, visualizations, frontend-pages  
- **visualizations** can consult: api-bridge, sql-mcp, table-views, frontend-pages
- **navigation** can consult: auth, frontend-pages, api-bridge, backend-control
- **sql-mcp** can consult: transactions, gap-analyzer
- **transactions** can consult: sql-mcp, auth, api-bridge, gap-analyzer
- **auth** can consult: api-bridge, frontend-pages, navigation, transactions
- **backend-control** can consult: auth, table-views, api-bridge, transactions
- **api-bridge** can consult: auth, transactions, frontend-pages, sql-mcp
- **gap-analyzer** can consult: ALL agents (and be consulted by all)

## 🗄️ SQL MCP Integration

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sql-server-mcp": {
      "command": "node",
      "args": [".agents/data-agents/sql-mcp/index.js"],
      "cwd": "C:/Users/AS/source/repos/item_information/item_information",
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

### Usage Examples

```bash
# Basic queries
agent.bat sql-mcp "List all tables in the database"
agent.bat sql-mcp "Show the schema for the vendor_items_temp table"
agent.bat sql-mcp "Get the top 10 users by created date"

# Complex analysis
agent.bat sql-mcp "Find all tables with UPC-related columns"
agent.bat sql-mcp "Analyze the performance of vendor item queries"
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
- **transactions**: `helpers/**/*Handler.js`, `routes/**/*.js`

### System Agents  
- **auth**: `middleware/auth.js`, `client/src/services/authService.ts`
- **backend-control**: `routes/admin*.js`, `client/src/pages/**/Admin*.tsx`
- **api-bridge**: `app.js`, `routes/**/*.js`, `client/src/services/**/*.ts`

### Meta Agents
- **gap-analyzer**: `**/*` (all files for comprehensive analysis)

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

### 2. Debug Performance Issue
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

### 3. Add Admin Feature
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
4. **Agent not found**: Run `agent.bat list` to see available agents

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
- **Authentication**: Agents respect your JWT implementation
- **File Uploads**: Agents understand your Excel processing workflow

### Development Workflow

1. **Planning**: Use `gap-analyzer` to identify what needs to be built
2. **Design**: Use `api-bridge` and `sql-mcp` to design data flow
3. **Backend**: Use `transactions` and `auth` for server-side implementation
4. **Frontend**: Use `frontend-pages`, `table-views`, `visualizations` for UI
5. **Integration**: Use `navigation` and `api-bridge` to connect everything
6. **Admin**: Use `backend-control` for administrative features
7. **Validation**: Use `gap-analyzer` to ensure nothing is missing

## 🔐 Security Notes

- Agents respect your existing authentication system
- SQL MCP uses your existing database credentials
- No sensitive data is logged or stored by the agent system
- Inter-agent communication is local and secure
- All database operations go through your established connection patterns

## 📈 Performance

- Agents run on-demand, no background processes
- SQL MCP uses connection pooling for efficiency  
- Inter-agent consultation is asynchronous and parallel-capable
- File pattern matching is optimized for large codebases
- Gap analysis can be cached and incremental

---

**Ready to use your agent system!** Start with `agent.bat list` to see all available agents and begin building with AI assistance.