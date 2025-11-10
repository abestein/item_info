#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import AgentSystem from './agent-system.js';

const program = new Command();
const system = new AgentSystem();

async function initializeSystem() {
    console.log(chalk.blue('Loading agent system...'));
    await system.loadAllAgents();
    console.log(chalk.green(`✓ Loaded ${system.listAgents().length} agents\n`));
}

program
    .name('agent')
    .description('Multi-Agent Development System')
    .version('1.0.0');

program
    .command('list')
    .description('List all available agents')
    .action(async () => {
        await initializeSystem();
        
        console.log(chalk.cyan.bold('Available Agents:'));
        console.log(chalk.cyan('================\n'));
        
        const agents = system.listAgents();
        for (const agent of agents) {
            console.log(chalk.yellow(`${agent.id.padEnd(15)} - ${agent.name}`));
            console.log(chalk.dim(`${' '.repeat(15)}   ${agent.description}\n`));
        }
    });

program
    .command('matrix')
    .description('Show consultation permissions between agents')
    .action(async () => {
        await initializeSystem();
        
        console.log(chalk.cyan.bold('Consultation Matrix:'));
        console.log(chalk.cyan('===================\n'));
        
        const matrix = system.getConsultationMatrix();
        for (const [agentId, canConsult] of Object.entries(matrix)) {
            const consultable = canConsult.length > 0 ? canConsult.join(', ') : 'none';
            console.log(chalk.yellow(`${agentId.padEnd(15)} can consult: ${consultable}`));
        }
    });

program
    .command('run <agent> <task>')
    .description('Execute a task with a specific agent')
    .option('-c, --context <file>', 'JSON file with additional context')
    .action(async (agentId, task, options) => {
        await initializeSystem();
        
        let context = {};
        if (options.context) {
            try {
                const fs = await import('fs/promises');
                const contextData = await fs.readFile(options.context, 'utf8');
                context = JSON.parse(contextData);
            } catch (error) {
                console.error(chalk.red(`Error loading context file: ${error.message}`));
                return;
            }
        }
        
        console.log(chalk.blue(`Executing task with ${agentId}...`));
        const result = await system.executeAgentTask(agentId, task, context);
        
        if (result.success) {
            console.log(chalk.green.bold(`\n=== ${result.agent} Response ===`));
            console.log(result.response);
        } else {
            console.error(chalk.red.bold('\n=== Error ==='));
            console.error(chalk.red(result.error || 'Unknown error'));
        }
    });

program
    .command('gap-analyzer <analysis>')
    .description('Run comprehensive gap analysis')
    .action(async (analysis) => {
        await initializeSystem();
        
        console.log(chalk.blue('Running gap analysis...'));
        const result = await system.executeAgentTask('gap-analyzer', analysis);
        
        if (result.success) {
            console.log(chalk.green.bold('\n=== Gap Analysis Results ==='));
            console.log(result.response);
        } else {
            console.error(chalk.red.bold('\n=== Error ==='));
            console.error(chalk.red(result.error || 'Unknown error'));
        }
    });

program
    .command('sql-mcp <query>')
    .description('Execute SQL query through direct DB connection (MCP as fallback)')
    .action(async (query) => {
        console.log(chalk.blue('Executing SQL query via direct connection...'));

        try {
            // Import required modules
            const sql = (await import('mssql')).default;
            const dotenv = (await import('dotenv')).default;
            const path = (await import('path')).default;
            const { fileURLToPath } = await import('url');
            const __dirname = path.dirname(fileURLToPath(import.meta.url));

            // Load .env from project root
            dotenv.config({ path: path.join(__dirname, '../../.env') });

            // Database configuration
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

            // Connect to database
            await sql.connect(dbConfig);

            // Detect query type and execute appropriately
            let result;

            // Check if it's a stored procedure definition request
            if (query.toLowerCase().includes('stored procedure') ||
                query.toLowerCase().includes('sp_') ||
                query.toLowerCase().includes('procedure definition')) {

                // Extract procedure name
                const spMatch = query.match(/sp_[\w]+/i);
                if (spMatch) {
                    const spName = spMatch[0];
                    const spResult = await sql.query`
                        SELECT OBJECT_DEFINITION(OBJECT_ID(${spName})) AS ProcedureDefinition
                    `;

                    console.log(chalk.green.bold('\n=== Stored Procedure Definition ==='));
                    console.log(spResult.recordset[0]?.ProcedureDefinition || 'Procedure not found');
                    await sql.close();
                    return;
                }
            }

            // Check if it's a list tables request
            if (query.toLowerCase().includes('list tables') ||
                query.toLowerCase().includes('show tables') ||
                query.toLowerCase().includes('all tables')) {

                result = await sql.query`
                    SELECT TABLE_NAME, TABLE_SCHEMA
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_TYPE = 'BASE TABLE'
                    ORDER BY TABLE_SCHEMA, TABLE_NAME
                `;

                console.log(chalk.green.bold('\n=== Database Tables ==='));
                console.table(result.recordset);
                await sql.close();
                return;
            }

            // Check if it's a table schema request
            if (query.toLowerCase().includes('schema') ||
                query.toLowerCase().includes('structure') ||
                query.toLowerCase().includes('columns')) {

                // Try different patterns to extract table name
                let tableName;

                // Pattern 1: "schema of TableName" or "TableName table"
                let match = query.match(/(?:schema of|structure of|columns (?:of|in))\s+(\w+)/i);
                if (match) tableName = match[1];

                // Pattern 2: "TableName schema" or "TableName structure"
                if (!match) {
                    match = query.match(/(\w+)\s+(?:table|schema|structure|columns)/i);
                    if (match) tableName = match[1];
                }

                // Pattern 3: Just look for a word that might be a table name
                if (!match) {
                    const words = query.split(/\s+/);
                    // Look for capitalized words or words with underscores (common table name patterns)
                    for (const word of words) {
                        if (word.includes('_') || /^[A-Z]/.test(word)) {
                            tableName = word;
                            break;
                        }
                    }
                }

                if (tableName) {
                    result = await sql.query`
                        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_NAME = ${tableName}
                        ORDER BY ORDINAL_POSITION
                    `;

                    console.log(chalk.green.bold(`\n=== ${tableName} Schema ===`));
                    console.table(result.recordset);
                    await sql.close();
                    return;
                }
            }

            // Otherwise, try to execute as raw SQL query
            result = await sql.query(query);

            console.log(chalk.green.bold('\n=== Query Results ==='));
            if (result.recordset && result.recordset.length > 0) {
                console.table(result.recordset);
                console.log(chalk.dim(`\nRows: ${result.recordset.length}`));
            } else {
                console.log(chalk.yellow('No results returned'));
                console.log(chalk.dim(`Rows affected: ${result.rowsAffected}`));
            }

            await sql.close();

        } catch (error) {
            console.error(chalk.red.bold('\n=== Direct DB Error ==='));
            console.error(chalk.red(error.message));
            console.log(chalk.yellow('\nFalling back to MCP agent system...'));

            // Fallback to the original MCP agent approach
            await initializeSystem();
            const result = await system.executeAgentTask('sql-mcp', query);

            if (result.success) {
                console.log(chalk.green.bold('\n=== SQL MCP Response ==='));
                console.log(result.response);
            } else {
                console.error(chalk.red.bold('\n=== MCP Error ==='));
                console.error(chalk.red(result.error || 'Unknown error'));
            }
        }
    });

program
    .command('consult <requesting-agent> <target-agent> <query>')
    .description('Have one agent consult another')
    .action(async (requestingAgent, targetAgent, query) => {
        await initializeSystem();
        
        console.log(chalk.blue(`${requestingAgent} consulting ${targetAgent}...`));
        const result = await system.consultAgent(requestingAgent, targetAgent, query);
        
        if (result.success) {
            console.log(chalk.green.bold(`\n=== ${result.respondingAgent} Response ===`));
            console.log(result.response);
        } else {
            console.error(chalk.red.bold('\n=== Error ==='));
            console.error(chalk.red(result.response));
        }
    });

// If no command provided, show help
if (process.argv.length <= 2) {
    program.help();
}

program.parse();