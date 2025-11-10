# Agent Router

An intelligent meta-agent that automatically determines which specialized agent to call based on user requests.

## Features

- **Intelligent Routing**: Analyzes request content and routes to appropriate specialized agents
- **Keyword Matching**: Uses configurable keyword patterns to identify request types
- **Confidence Scoring**: Provides confidence scores for routing decisions
- **Fallback Handling**: Automatically falls back to general orchestrator when no specific match found
- **Agent Discovery**: Automatically discovers available agents in the system
- **Routing History**: Tracks routing decisions for analysis and improvement

## Usage

### Command Line
```bash
node agent-router.js "analyze sales data for trends"
# Routes to: gap-analyzer (confidence: 75%)

node agent-router.js "select all items from inventory table"  
# Routes to: sql-server-mcp (confidence: 85%)

node agent-router.js "process customer payment"
# Routes to: transactions (confidence: 90%)
```

### Programmatic Usage
```javascript
const AgentRouter = require('./agent-router');
const router = new AgentRouter();

const routing = router.executeRouting("show me database tables");
console.log(`Selected agent: ${routing.agent}`);
console.log(`Confidence: ${(routing.confidence * 100).toFixed(1)}%`);
console.log(`Reasoning: ${routing.reasoning}`);
```

## Configuration

Edit `config.json` to customize routing rules:

```json
{
  "routing_rules": {
    "sql_operations": {
      "keywords": ["database", "sql", "query", "table"],
      "target_agent": "sql-server-mcp",
      "confidence_threshold": 0.7
    },
    "custom_rule": {
      "keywords": ["your", "keywords"],
      "target_agent": "your-agent",
      "confidence_threshold": 0.6
    }
  },
  "fallback_agent": "orchestrator"
}
```

## Routing Rules

The router currently handles:

1. **SQL Operations** → `sql-server-mcp`
   - Keywords: database, sql, query, table, select, insert, update, delete, mssql
   
2. **Data Analysis** → `gap-analyzer`
   - Keywords: analyze, report, chart, graph, statistics, trends, dashboard
   
3. **Transaction Processing** → `transactions`
   - Keywords: transaction, payment, order, process, workflow
   
4. **General Tasks** → `orchestrator`
   - Default fallback for unmatched requests

## Agent Discovery

The router automatically discovers agents in:
- `.agents/data-agents/` - Data processing agents
- `.agents/meta-agents/` - Meta-orchestration agents  
- `.agents/orchestrator/` - Main orchestrator

## Integration with MCP

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-router": {
      "command": "node",
      "args": [".agents/meta-agents/router/agent-router.js"],
      "cwd": "C:/Users/A.Stein/Source/Repos/item_info"
    }
  }
}
```

## API

### Methods

- `routeRequest(request, context)` - Analyze and route a request
- `executeRouting(request, context)` - Execute routing with logging
- `getAvailableAgents()` - List discovered agents
- `getRoutingHistory(limit)` - View recent routing decisions
- `getAgentInfo(agentName)` - Get agent details

### Response Format

```javascript
{
  "agent": "sql-server-mcp",
  "agentPath": "/path/to/agent",
  "agentType": "data-agent", 
  "confidence": 0.85,
  "reasoning": "Matched rule 'sql_operations' with confidence 85.0%"
}
```