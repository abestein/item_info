const fs = require('fs');

// Get the request from command line
const request = process.argv.slice(2).join(' ').replace(/"/g, '');

console.log('🎯 ORCHESTRATION PLAN ANALYSIS');
console.log('═══════════════════════════════════════════════════════');
console.log('Original Request:', request);
console.log('');

// Agent registry
const agents = {
    'excel-mcp': {
        name: 'Excel MCP Agent',
        type: 'data-agent',
        expertise: ['Excel file reading', 'Data extraction', 'Format conversion'],
        capabilities: ['Read XLSX files', 'Extract data ranges', 'Handle formulas']
    },
    'sql-mcp': {
        name: 'SQL MCP Agent',
        type: 'data-agent',
        expertise: ['SQL Server operations', 'Database queries', 'Schema management'],
        capabilities: ['Execute queries', 'Bulk imports', 'Transaction management']
    },
    'transactions': {
        name: 'Transactions Agent',
        type: 'data-agent',
        expertise: ['Data validation', 'CRUD operations', 'Business logic'],
        capabilities: ['Data cleaning', 'Validation rules', 'Error handling']
    },
    'gap-analyzer': {
        name: 'Gap Analyzer Agent',
        type: 'meta-agent',
        expertise: ['System analysis', 'Feature assessment', 'Requirements analysis'],
        capabilities: ['Missing feature detection', 'Capability analysis', 'Recommendation engine']
    },
    'table-views': {
        name: 'Table Views Agent',
        type: 'ui-agent',
        expertise: ['Data tables', 'Grid displays', 'Data visualization'],
        capabilities: ['Table creation', 'Sorting/filtering', 'Data presentation']
    },
    'visualizations': {
        name: 'Visualizations Agent',
        type: 'ui-agent',
        expertise: ['Charts', 'Dashboards', 'Data visualization'],
        capabilities: ['Chart creation', 'Dashboard design', 'Interactive visuals']
    }
};

// Analyze request and create orchestration plan
function analyzeRequest(request) {
    const plan = {
        agents: [],
        prompts: [],
        missingCapabilities: []
    };

    const requestLower = request.toLowerCase();

    // Excel-related tasks
    if (requestLower.includes('excel') || requestLower.includes('xlsx') || requestLower.includes('spreadsheet')) {
        plan.agents.push('excel-mcp');
        plan.prompts.push({
            agent: 'excel-mcp',
            prompt: 'Extract and analyze data from the Excel file. Validate data structure and prepare for processing.',
            reason: 'Request involves Excel file operations'
        });
    }

    // SQL/Database tasks
    if (requestLower.includes('sql') || requestLower.includes('database') || requestLower.includes('import') || requestLower.includes('table')) {
        plan.agents.push('sql-mcp');
        plan.prompts.push({
            agent: 'sql-mcp',
            prompt: 'Handle database operations including schema validation, data import, and transaction management.',
            reason: 'Request involves database operations'
        });
    }

    // Data validation and processing
    if (requestLower.includes('import') || requestLower.includes('validate') || requestLower.includes('clean') || requestLower.includes('process')) {
        plan.agents.push('transactions');
        plan.prompts.push({
            agent: 'transactions',
            prompt: 'Validate, clean, and process data according to business rules. Handle error recovery and data integrity.',
            reason: 'Request requires data validation and processing'
        });
    }

    // UI/Display tasks
    if (requestLower.includes('display') || requestLower.includes('show') || requestLower.includes('view') || requestLower.includes('interface')) {
        if (requestLower.includes('table') || requestLower.includes('grid')) {
            plan.agents.push('table-views');
            plan.prompts.push({
                agent: 'table-views',
                prompt: 'Create data table views with appropriate sorting, filtering, and display options.',
                reason: 'Request involves tabular data display'
            });
        }
        if (requestLower.includes('chart') || requestLower.includes('visual') || requestLower.includes('dashboard')) {
            plan.agents.push('visualizations');
            plan.prompts.push({
                agent: 'visualizations',
                prompt: 'Create appropriate data visualizations and charts for the processed data.',
                reason: 'Request involves data visualization'
            });
        }
    }

    // Analysis tasks
    if (requestLower.includes('analyze') || requestLower.includes('missing') || requestLower.includes('gap') || requestLower.includes('assess')) {
        plan.agents.push('gap-analyzer');
        plan.prompts.push({
            agent: 'gap-analyzer',
            prompt: 'Analyze the request for missing capabilities, potential gaps, and provide recommendations.',
            reason: 'Request requires analysis and assessment'
        });
    }

    return plan;
}

const orchestrationPlan = analyzeRequest(request);

console.log('📋 IDENTIFIED AGENTS NEEDED:');
console.log('───────────────────────────────────────────────────────');
orchestrationPlan.agents.forEach((agentId, index) => {
    const agent = agents[agentId];
    if (agent) {
        console.log(`${index + 1}. ${agent.name} (${agent.type})`);
        console.log(`   Expertise: ${agent.expertise.join(', ')}`);
        console.log(`   Capabilities: ${agent.capabilities.join(', ')}`);
        console.log('');
    }
});

console.log('💬 PROMPTS TO BE SENT:');
console.log('───────────────────────────────────────────────────────');
orchestrationPlan.prompts.forEach((promptInfo, index) => {
    const agent = agents[promptInfo.agent];
    if (agent) {
        console.log(`${index + 1}. TO: ${agent.name} (${promptInfo.agent})`);
        console.log(`   REASON: ${promptInfo.reason}`);
        console.log(`   PROMPT: ${promptInfo.prompt}`);
        console.log('');
    }
});

if (orchestrationPlan.missingCapabilities.length > 0) {
    console.log('⚠️  MISSING CAPABILITIES DETECTED:');
    console.log('───────────────────────────────────────────────────────');
    orchestrationPlan.missingCapabilities.forEach((missing, index) => {
        console.log(`${index + 1}. ${missing}`);
    });
    console.log('');
}

console.log('🎯 EXECUTION PLAN SUMMARY:');
console.log('───────────────────────────────────────────────────────');
console.log(`Agents to use: ${orchestrationPlan.agents.length}`);
console.log(`Prompts to send: ${orchestrationPlan.prompts.length}`);
console.log(`Missing capabilities: ${orchestrationPlan.missingCapabilities.length}`);
console.log('');

// Export plan for execution
fs.writeFileSync('orchestration_plan.json', JSON.stringify({
    originalRequest: request,
    agents: orchestrationPlan.agents,
    prompts: orchestrationPlan.prompts,
    missingCapabilities: orchestrationPlan.missingCapabilities,
    timestamp: new Date().toISOString()
}, null, 2));

console.log('📁 Orchestration plan saved to: orchestration_plan.json');