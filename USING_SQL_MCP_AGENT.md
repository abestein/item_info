# Using the SQL MCP Agent - Quick Guide

## ✅ NOW WORKING! (Updated 2025-11-05)

The SQL MCP agent now uses **direct database connection FIRST**, so it works without API keys!

## Quick Examples

### Get Stored Procedure Definition
```bash
agent.bat sql-mcp "Get the definition of stored procedure sp_Refresh_Item_Barry_UPC"
```

### List All Tables
```bash
agent.bat sql-mcp "list all tables"
```

### Get Table Schema
```bash
agent.bat sql-mcp "Show me the schema of UPC_list table"
```

### Execute Raw SQL
```bash
agent.bat sql-mcp "SELECT TOP 10 ItemCode, Level, UPC FROM UPC_list"
```

### Get Table Data
```bash
agent.bat sql-mcp "SELECT * FROM Users WHERE role = 'admin'"
```

## How It Works

1. **Direct Connection First** ✅
   - Uses credentials from `.env` file
   - No API keys needed
   - Fast and reliable

2. **Smart Query Detection** 🧠
   - Detects stored procedure requests
   - Recognizes table list queries
   - Identifies schema requests
   - Executes raw SQL directly

3. **Automatic Fallback** 🔄
   - If direct connection fails
   - Falls back to MCP protocol
   - (Requires Anthropic/OpenRouter API keys)

## What Changed?

### Before (❌ Broken):
```bash
agent.bat sql-mcp "query"
# Error: 401 invalid x-api-key
```

### Now (✅ Working):
```bash
agent.bat sql-mcp "query"
# Executing SQL query via direct connection...
# [Results displayed]
```

## Alternative: Direct Node.js Scripts

For custom automation or complex queries, you can still use direct Node.js scripts:

```bash
# Copy the template
cp helpers/db-query-template.mjs my_query.mjs

# Edit my_query.mjs with your SQL

# Run it
node my_query.mjs
```

## Technical Details

**Files Modified:**
- `.agents/orchestrator/cli.js` - Added direct DB connection logic
- `.agents/orchestrator/package.json` - Added mssql dependency

**Connection Info:**
- Uses `.env` file in project root
- Reads: DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD, DB_PORT
- Connects directly via mssql package

## Benefits

✅ No API keys required
✅ Fast execution (no API roundtrip)
✅ Natural language support
✅ Raw SQL support
✅ Smart query detection
✅ Automatic error fallback

---

**For more details, see:** `SQL_MCP_SETUP.md`
