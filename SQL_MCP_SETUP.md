# SQL MCP Agent Setup & Best Practices

## Summary

The SQL MCP agent has been updated to include new tools for working with stored procedures. However, based on practical experience, **the direct Node.js approach is recommended** over using the agent system.

## What Was Updated

### 1. New Tools Added to SQL MCP Agent

File: `.agents/data-agents/sql-mcp/index.js`

**New Tools:**
- `get_stored_procedure_definition` - Get SQL code of a stored procedure
- `list_stored_procedures` - List all stored procedures in database

### 2. Documentation Created

- **`.agents/data-agents/sql-mcp/README.md`** - Agent documentation
- **`helpers/db-query-template.mjs`** - Reusable template for DB queries
- **This file** - Setup instructions

## The Problem We Encountered

When trying to use the SQL MCP agent via the command:
```bash
agent.bat sql-mcp "Get stored procedure definition..."
```

We got this error:
```
401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

**Root Cause:** The agent orchestrator system requires API keys (Anthropic/OpenRouter) to route commands, even though the SQL MCP agent itself connects directly to the database.

## The Solution That Now Works ✅

**UPDATE (2025-11-05):** The SQL MCP agent orchestrator has been updated to use the direct database connection approach FIRST, with MCP as a fallback!

### New Behavior:

```bash
# Now works without API keys! 🎉
agent.bat sql-mcp "Get stored procedure sp_Refresh_Item_Barry_UPC"
agent.bat sql-mcp "list all tables"
agent.bat sql-mcp "Show me the schema of UPC_list table"
agent.bat sql-mcp "SELECT TOP 10 * FROM UPC_list"
```

The orchestrator now:
1. **Tries direct database connection first** (no API keys needed)
2. Falls back to MCP protocol only if direct connection fails
3. Supports natural language queries and raw SQL

### Alternative: Use direct Node.js scripts

**Use direct Node.js scripts** that connect to SQL Server using the `mssql` package and credentials from `.env` file.

### Example: Get Stored Procedure Definition

```javascript
// get_sp_definition.mjs
import sql from 'mssql';
import { config } from 'dotenv';

config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD?.replace(/"/g, ''),
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function getSPDefinition() {
    await sql.connect(dbConfig);

    const result = await sql.query`
        SELECT OBJECT_DEFINITION(OBJECT_ID('sp_Refresh_Item_Barry_UPC'))
        AS ProcedureDefinition
    `;

    console.log(result.recordset[0].ProcedureDefinition);
    await sql.close();
}

getSPDefinition();
```

Run it:
```bash
node get_sp_definition.mjs
```

## Comparison of Approaches

| Aspect | Agent System (NEW) | Direct Node.js Scripts |
|--------|-------------------|----------------------|
| **API Keys** | ❌ Not needed (direct DB first!) | ❌ Not needed |
| **Complexity** | ⭐⭐ Moderate | ⭐ Simple |
| **Speed** | ⚡ Fast (direct connection) | ⚡⚡ Fastest |
| **Reliability** | ✅ Very reliable | ✅ Always works |
| **Natural Language** | ✅ Supported | ❌ Raw SQL only |
| **Raw SQL** | ✅ Supported | ✅ Supported |
| **Configuration** | ✅ Uses .env | ✅ Uses .env |
| **Cost** | 💰 Free | 💰 Free |
| **Use Case** | Quick queries from CLI | Custom scripts, automation |

## Best Practices Going Forward

### ✅ DO:
1. **Use the template:** Copy `helpers/db-query-template.mjs` for new queries
2. **Keep it simple:** Direct SQL queries are faster and more reliable
3. **Use .env credentials:** They're already configured
4. **Clean up:** Delete temporary query scripts after use

### ❌ DON'T:
1. **Don't rely on agent system** for database queries (API key issues)
2. **Don't hardcode credentials** - always use .env
3. **Don't leave temp files** - clean them up after use

## Quick Reference

### Get Stored Procedure Definition
```javascript
const result = await sql.query`
    SELECT OBJECT_DEFINITION(OBJECT_ID('sp_YourProcedure'))
    AS ProcedureDefinition
`;
console.log(result.recordset[0].ProcedureDefinition);
```

### List All Stored Procedures
```javascript
const result = await sql.query`
    SELECT ROUTINE_NAME, CREATED, LAST_ALTERED
    FROM INFORMATION_SCHEMA.ROUTINES
    WHERE ROUTINE_TYPE = 'PROCEDURE'
    ORDER BY ROUTINE_NAME
`;
console.table(result.recordset);
```

### Get Table Structure
```javascript
const result = await sql.query`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'YourTableName'
    ORDER BY ORDINAL_POSITION
`;
console.table(result.recordset);
```

### Execute Stored Procedure
```javascript
const request = new sql.Request();
request.input('param1', sql.VarChar, 'value');
const result = await request.execute('sp_YourProcedure');
console.table(result.recordset);
```

## Conclusion

While the SQL MCP agent has been enhanced with new tools, **the direct Node.js approach is the recommended method** for database operations due to its simplicity, reliability, and lack of dependency on external APIs.

The template file `helpers/db-query-template.mjs` provides a starting point for any database query needs.

## What Was Changed (2025-11-05)

### Files Modified:

1. **`.agents/orchestrator/cli.js`**
   - Modified `sql-mcp` command to use direct database connection first
   - Added smart query detection (stored procedures, tables, schemas)
   - Falls back to MCP protocol only on error
   - Supports both natural language and raw SQL queries

2. **`.agents/orchestrator/package.json`**
   - Added `mssql` dependency (v11.0.1)

### How It Works Now:

```javascript
// When you run: agent.bat sql-mcp "Get sp_MyProcedure"

1. Orchestrator detects query type (SP definition, table list, schema, or raw SQL)
2. Connects directly to DB using .env credentials
3. Executes appropriate SQL query
4. Returns formatted results
5. If error occurs, falls back to MCP protocol (requires API keys)
```

### Benefits:

- ✅ **No API keys needed** for most queries
- ✅ **Faster execution** (no API roundtrip)
- ✅ **Natural language support** ("Get stored procedure X", "list tables", etc.)
- ✅ **Raw SQL support** (SELECT, INSERT, UPDATE, etc.)
- ✅ **Automatic fallback** to MCP if needed

---

**Last Updated:** 2025-11-05 (Orchestrator updated with direct DB connection)
**Tested With:** SQL Server on 10.40.1.4, Item_DimensionsBU database
