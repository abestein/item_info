#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

class SQLServerMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'sql-server-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.connectionPool = null;
    this.setupHandlers();
  }

  async initializeDatabase() {
    try {
      const config = {
        user: process.env.DB_USER || 'sa',
        password: process.env.DB_PASSWORD,
        server: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 1433,
        database: process.env.DB_NAME || 'master',
        options: {
          encrypt: false,
          trustServerCertificate: true,
          enableArithAbort: true,
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };

      this.connectionPool = await sql.connect(config);
      console.error('Connected to SQL Server');
    } catch (err) {
      console.error('Database connection failed:', err);
      throw err;
    }
  }

  setupHandlers() {
    // Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'execute_query',
          description: 'Execute a SELECT query and return results',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL SELECT query to execute',
              },
              parameters: {
                type: 'object',
                description: 'Query parameters as key-value pairs',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'execute_command',
          description: 'Execute INSERT, UPDATE, DELETE, or DDL commands',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'SQL command to execute',
              },
              parameters: {
                type: 'object',
                description: 'Command parameters as key-value pairs',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'execute_transaction',
          description: 'Execute multiple commands in a transaction',
          inputSchema: {
            type: 'object',
            properties: {
              commands: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sql: { type: 'string' },
                    parameters: { type: 'object' }
                  },
                  required: ['sql']
                },
                description: 'Array of SQL commands to execute in transaction',
              },
            },
            required: ['commands'],
          },
        },
        {
          name: 'get_table_schema',
          description: 'Get schema information for a table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to get schema for',
              },
            },
            required: ['tableName'],
          },
        },
        {
          name: 'list_tables',
          description: 'List all tables in the database',
          inputSchema: {
            type: 'object',
            properties: {
              schema: {
                type: 'string',
                description: 'Schema name (optional)',
              },
            },
          },
        },
        {
          name: 'get_table_data',
          description: 'Get sample data from a table with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table',
              },
              limit: {
                type: 'number',
                description: 'Number of rows to return (default: 100)',
                default: 100,
              },
              whereClause: {
                type: 'string',
                description: 'Optional WHERE clause (without WHERE keyword)',
              },
            },
            required: ['tableName'],
          },
        },
        {
          name: 'execute_stored_procedure',
          description: 'Execute a stored procedure',
          inputSchema: {
            type: 'object',
            properties: {
              procedureName: {
                type: 'string',
                description: 'Name of the stored procedure',
              },
              parameters: {
                type: 'object',
                description: 'Parameters for the stored procedure',
              },
            },
            required: ['procedureName'],
          },
        },
        {
          name: 'get_query_plan',
          description: 'Get execution plan for a query',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SQL query to analyze',
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    // Resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'sqlserver://tables',
          name: 'Database Tables',
          description: 'List of all tables in the database',
          mimeType: 'application/json',
        },
        {
          uri: 'sqlserver://schema',
          name: 'Database Schema',
          description: 'Complete database schema information',
          mimeType: 'application/json',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'sqlserver://tables':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(await this.getAllTables(), null, 2),
              },
            ],
          };
        
        case 'sqlserver://schema':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json', 
                text: JSON.stringify(await this.getDatabaseSchema(), null, 2),
              },
            ],
          };
        
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // Tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_query':
            return await this.executeQuery(args.query, args.parameters);
          
          case 'execute_command':
            return await this.executeCommand(args.command, args.parameters);
          
          case 'execute_transaction':
            return await this.executeTransaction(args.commands);
          
          case 'get_table_schema':
            return await this.getTableSchema(args.tableName);
          
          case 'list_tables':
            return await this.listTables(args.schema);
          
          case 'get_table_data':
            return await this.getTableData(args.tableName, args.limit, args.whereClause);
          
          case 'execute_stored_procedure':
            return await this.executeStoredProcedure(args.procedureName, args.parameters);
          
          case 'get_query_plan':
            return await this.getQueryPlan(args.query);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async executeQuery(query, parameters = {}) {
    try {
      const request = this.connectionPool.request();
      
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rowsAffected: result.rowsAffected,
              recordset: result.recordset.slice(0, 1000),
              totalRows: result.recordset.length,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async executeCommand(command, parameters = {}) {
    try {
      const request = this.connectionPool.request();
      
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(command);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              rowsAffected: result.rowsAffected,
              message: 'Command executed successfully',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  async executeTransaction(commands) {
    const transaction = new sql.Transaction(this.connectionPool);
    
    try {
      await transaction.begin();
      
      const results = [];
      for (const command of commands) {
        const request = new sql.Request(transaction);
        
        if (command.parameters) {
          Object.entries(command.parameters).forEach(([key, value]) => {
            request.input(key, value);
          });
        }
        
        const result = await request.query(command.sql);
        results.push({
          sql: command.sql,
          rowsAffected: result.rowsAffected,
        });
      }
      
      await transaction.commit();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Transaction completed successfully',
              results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  async getTableSchema(tableName) {
    try {
      const query = `
        SELECT 
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.CHARACTER_MAXIMUM_LENGTH,
          c.NUMERIC_PRECISION,
          c.NUMERIC_SCALE,
          c.IS_NULLABLE,
          c.COLUMN_DEFAULT,
          CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 'YES' ELSE 'NO' END AS IS_PRIMARY_KEY,
          CASE WHEN fk.COLUMN_NAME IS NOT NULL THEN 'YES' ELSE 'NO' END AS IS_FOREIGN_KEY,
          fk.REFERENCED_TABLE_NAME,
          fk.REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN (
          SELECT ku.TABLE_NAME, ku.COLUMN_NAME
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS ku
            ON tc.CONSTRAINT_TYPE = 'PRIMARY KEY' 
            AND tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        ) pk ON c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
        LEFT JOIN (
          SELECT 
            ku.TABLE_NAME,
            ku.COLUMN_NAME,
            ku2.TABLE_NAME AS REFERENCED_TABLE_NAME,
            ku2.COLUMN_NAME AS REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
            ON rc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
          INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku2
            ON rc.UNIQUE_CONSTRAINT_NAME = ku2.CONSTRAINT_NAME
        ) fk ON c.TABLE_NAME = fk.TABLE_NAME AND c.COLUMN_NAME = fk.COLUMN_NAME
        WHERE c.TABLE_NAME = @tableName
        ORDER BY c.ORDINAL_POSITION
      `;

      const request = this.connectionPool.request();
      request.input('tableName', sql.VarChar, tableName);
      const result = await request.query(query);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              tableName,
              columns: result.recordset,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table schema: ${error.message}`);
    }
  }

  async listTables(schema = null) {
    try {
      let query = `
        SELECT 
          TABLE_NAME,
          TABLE_TYPE,
          TABLE_SCHEMA
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
      `;

      if (schema) {
        query += ` AND TABLE_SCHEMA = @schema`;
      }

      query += ` ORDER BY TABLE_SCHEMA, TABLE_NAME`;

      const request = this.connectionPool.request();
      if (schema) {
        request.input('schema', sql.VarChar, schema);
      }

      const result = await request.query(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              schema: schema || 'all',
              tables: result.recordset,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }
  }

  async getTableData(tableName, limit = 100, whereClause = '') {
    try {
      let query = `SELECT TOP ${limit} * FROM [${tableName}]`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await this.connectionPool.request().query(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              tableName,
              limit,
              whereClause,
              rowCount: result.recordset.length,
              data: result.recordset,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table data: ${error.message}`);
    }
  }

  async executeStoredProcedure(procedureName, parameters = {}) {
    try {
      const request = this.connectionPool.request();
      
      Object.entries(parameters).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.execute(procedureName);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              procedureName,
              success: true,
              recordsets: result.recordsets,
              returnValue: result.returnValue,
              output: result.output,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Stored procedure execution failed: ${error.message}`);
    }
  }

  async getQueryPlan(query) {
    try {
      const request = this.connectionPool.request();
      await request.query('SET SHOWPLAN_XML ON');
      
      const result = await request.query(query);
      
      await request.query('SET SHOWPLAN_XML OFF');
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              query,
              executionPlan: result.recordset,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get query plan: ${error.message}`);
    }
  }

  async getAllTables() {
    const result = await this.connectionPool.request().query(`
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `);
    return result.recordset;
  }

  async getDatabaseSchema() {
    const tables = await this.getAllTables();
    const schema = {};
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      const result = await this.connectionPool.request().query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);
      
      schema[tableName] = result.recordset;
    }
    
    return schema;
  }

  async run() {
    await this.initializeDatabase();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('SQL Server MCP server running on stdio');
  }
}

const server = new SQLServerMCP();
server.run().catch(console.error);