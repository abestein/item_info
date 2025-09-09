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
    .description('Execute SQL query through MCP')
    .action(async (query) => {
        await initializeSystem();
        
        console.log(chalk.blue('Executing SQL query...'));
        const result = await system.executeAgentTask('sql-mcp', query);
        
        if (result.success) {
            console.log(chalk.green.bold('\n=== SQL MCP Response ==='));
            console.log(result.response);
        } else {
            console.error(chalk.red.bold('\n=== Error ==='));
            console.error(chalk.red(result.error || 'Unknown error'));
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