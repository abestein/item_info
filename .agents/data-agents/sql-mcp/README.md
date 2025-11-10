# SQL Server MCP Agent

This agent provides direct SQL Server database access using the MCP (Model Context Protocol) standard.

## How It Works

The SQL MCP agent uses **direct database connection** via the `mssql` npm package. It reads connection credentials from the project's `.env` file:

```env
DB_SERVER=10.40.1.4
DB_DATABASE=Item_DimensionsBU
DB_USER=sa
DB_PASSWORD="Dyna.Admin@786%#"
DB_PORT=1433
```

**No API keys needed!** It connects directly to SQL Server.

## Available Tools

### 1. **get_stored_procedure_definition** ✨ NEW!
Get the SQL code/definition of a stored procedure.

**Example:**
```javascript
{
  "name": "get_stored_procedure_definition",
  "arguments": {
    "procedureName": "sp_Refresh_Item_Barry_UPC"
  }
}
```

**Returns:**
```json
{
  "procedureName": "sp_Refresh_Item_Barry_UPC",
  "definition": "CREATE PROCEDURE [dbo].[sp_Refresh_Item_Barry_UPC]..."
}
```

### 2. **list_stored_procedures** ✨ NEW!
List all stored procedures in the database.

**Example:**
```javascript
{
  "name": "list_stored_procedures",
  "arguments": {
    "schema": "dbo"  // optional
  }
}
```

### 3. **execute_query**
Execute a SELECT query and return results.

### 4. **execute_command**
Execute INSERT, UPDATE, DELETE, or DDL commands.

### 5. **get_table_schema**
Get schema information for a table.

### 6. **list_tables**
List all tables in the database.

### 7. **get_table_data**
Get sample data from a table.

### 8. **execute_stored_procedure**
Execute a stored procedure with parameters.

## Usage from Command Line

### Option 1: Direct Node.js Script (RECOMMENDED ✅)

This is the approach that **worked** and should be used going forward:

```javascript
// create_script.mjs
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

async function getStoredProcedure() {
    await sql.connect(dbConfig);

    const result = await sql.query`
        SELECT OBJECT_DEFINITION(OBJECT_ID('sp_Refresh_Item_Barry_UPC'))
        AS ProcedureDefinition
    `;

    console.log(result.recordset[0].ProcedureDefinition);
    await sql.close();
}

getStoredProcedure();
```

Then run:
```bash
node create_script.mjs
```

### Option 2: Via Agent System (May have auth issues ⚠️)

```bash
agent.bat sql-mcp "Get the definition of sp_Refresh_Item_Barry_UPC"
```

**Note:** This may fail with authentication errors if the orchestrator is not properly configured.

## Why Direct Connection Works Better

1. **No API Keys Required** - Uses existing DB credentials
2. **Simple & Reliable** - Direct connection, no middleware
3. **Fast** - No agent overhead
4. **Already Configured** - Uses your .env file

## Troubleshooting

### "401 invalid x-api-key" Error

This error comes from the agent orchestrator trying to use API keys. **Solution:** Use the direct Node.js script approach instead (Option 1 above).

### Connection Errors

Check your `.env` file:
- `DB_SERVER` should be the SQL Server hostname/IP
- `DB_DATABASE` should be the database name
- `DB_USER` and `DB_PASSWORD` should have proper access
- `DB_PORT` is usually 1433

## Summary

**✅ BEST PRACTICE:** For database operations, create simple Node.js scripts using the `mssql` package directly with credentials from `.env` file.

**⚠️ AVOID:** Relying on the agent orchestrator system which may have authentication issues.
