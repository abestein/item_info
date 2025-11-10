/**
 * AO Agent Training System
 * Trains the AO agent to better understand:
 * 1. Agent capabilities and expertise
 * 2. Optimal prompt creation for each agent
 * 3. Missing agent detection
 * 4. Workflow orchestration patterns
 */

const fs = require('fs');
const path = require('path');

class AOAgentTrainer {
    constructor() {
        this.agentRegistry = this.loadAgentRegistry();
        this.trainingPatterns = this.loadTrainingPatterns();
        this.orchestrationTemplates = this.loadOrchestrationTemplates();
    }

    loadAgentRegistry() {
        return {
            // Data Agents
            'excel-mcp': {
                name: 'Excel MCP Agent',
                type: 'data-agent',
                category: 'data-processing',
                expertise: [
                    'Excel file reading and parsing',
                    'XLSX format handling',
                    'Data extraction from spreadsheets',
                    'Formula processing',
                    'Multi-sheet operations',
                    'Data validation and cleaning'
                ],
                capabilities: [
                    'Read Excel files (.xlsx, .xls)',
                    'Extract specific data ranges',
                    'Handle complex formulas',
                    'Convert Excel data to JSON/CSV',
                    'Validate data structure',
                    'Process multiple worksheets'
                ],
                optimalPrompts: [
                    'Extract data from Excel file: {filename}',
                    'Analyze Excel structure and validate data quality',
                    'Convert Excel data to structured format for import',
                    'Process multiple Excel sheets and merge data'
                ],
                commonTasks: [
                    'data extraction', 'excel processing', 'spreadsheet analysis',
                    'data validation', 'format conversion'
                ],
                dependencies: ['transactions', 'gap-analyzer'],
                outputs: ['structured data', 'validation reports', 'error logs']
            },

            'sql-mcp': {
                name: 'SQL MCP Agent',
                type: 'data-agent',
                category: 'database-operations',
                expertise: [
                    'SQL Server operations',
                    'Database schema management',
                    'Query optimization',
                    'Transaction management',
                    'Bulk data operations',
                    'Database security'
                ],
                capabilities: [
                    'Execute SQL queries',
                    'Manage database schemas',
                    'Perform bulk imports/exports',
                    'Handle transactions',
                    'Monitor database performance',
                    'Implement security policies'
                ],
                optimalPrompts: [
                    'Execute database operation: {description}',
                    'Import data into table: {table_name}',
                    'Analyze database schema and optimize structure',
                    'Validate data integrity and relationships'
                ],
                commonTasks: [
                    'data import', 'database queries', 'schema management',
                    'data validation', 'performance optimization'
                ],
                dependencies: ['transactions', 'gap-analyzer'],
                outputs: ['query results', 'import status', 'performance metrics']
            },

            'transactions': {
                name: 'Transactions Agent',
                type: 'data-agent',
                category: 'data-processing',
                expertise: [
                    'Data validation and cleaning',
                    'Business rule enforcement',
                    'CRUD operations',
                    'Error handling and recovery',
                    'Data transformation',
                    'Workflow management'
                ],
                capabilities: [
                    'Validate data against business rules',
                    'Clean and transform data',
                    'Handle CRUD operations',
                    'Implement error recovery',
                    'Manage data workflows',
                    'Process batch operations'
                ],
                optimalPrompts: [
                    'Validate and clean data: {data_description}',
                    'Process business transaction: {transaction_type}',
                    'Implement data validation rules for: {entity}',
                    'Handle error recovery for failed operations'
                ],
                commonTasks: [
                    'data validation', 'data cleaning', 'business logic',
                    'error handling', 'workflow processing'
                ],
                dependencies: ['gap-analyzer'],
                outputs: ['validated data', 'processing reports', 'error logs']
            },

            // Meta Agents
            'gap-analyzer': {
                name: 'Gap Analyzer Agent',
                type: 'meta-agent',
                category: 'analysis',
                expertise: [
                    'System capability analysis',
                    'Feature gap detection',
                    'Requirements assessment',
                    'Missing functionality identification',
                    'System optimization recommendations',
                    'Architecture analysis'
                ],
                capabilities: [
                    'Analyze system capabilities',
                    'Identify missing features',
                    'Assess requirements coverage',
                    'Provide optimization recommendations',
                    'Generate gap analysis reports',
                    'Evaluate system architecture'
                ],
                optimalPrompts: [
                    'Analyze system gaps for: {functionality}',
                    'Assess missing capabilities in: {domain}',
                    'Evaluate system architecture and recommend improvements',
                    'Identify requirements not covered by current agents'
                ],
                commonTasks: [
                    'gap analysis', 'requirement assessment', 'system evaluation',
                    'optimization recommendations', 'capability mapping'
                ],
                dependencies: [],
                outputs: ['gap analysis reports', 'recommendations', 'capability maps']
            },

            'router': {
                name: 'Router Agent',
                type: 'meta-agent',
                category: 'orchestration',
                expertise: [
                    'Request routing and distribution',
                    'Agent selection optimization',
                    'Load balancing',
                    'Request parsing and analysis',
                    'Agent capability matching',
                    'Performance optimization'
                ],
                capabilities: [
                    'Route requests to optimal agents',
                    'Balance load across agents',
                    'Parse complex requests',
                    'Match capabilities to requirements',
                    'Optimize agent selection',
                    'Monitor agent performance'
                ],
                optimalPrompts: [
                    'Route request to optimal agent: {request}',
                    'Analyze request and recommend agent distribution',
                    'Balance workload across available agents',
                    'Optimize agent selection for: {task_type}'
                ],
                commonTasks: [
                    'request routing', 'agent selection', 'load balancing',
                    'capability matching', 'performance optimization'
                ],
                dependencies: ['gap-analyzer'],
                outputs: ['routing decisions', 'performance metrics', 'optimization reports']
            },

            // UI Agents
            'frontend-pages': {
                name: 'Frontend Pages Agent',
                type: 'ui-agent',
                category: 'user-interface',
                expertise: [
                    'Web page creation and management',
                    'User interface design',
                    'Component development',
                    'User experience optimization',
                    'Responsive design',
                    'Accessibility implementation'
                ],
                capabilities: [
                    'Create web pages',
                    'Design user interfaces',
                    'Develop reusable components',
                    'Implement responsive layouts',
                    'Ensure accessibility compliance',
                    'Optimize user experience'
                ],
                optimalPrompts: [
                    'Create web page for: {page_purpose}',
                    'Design user interface for: {functionality}',
                    'Develop responsive component: {component_type}',
                    'Optimize user experience for: {user_scenario}'
                ],
                commonTasks: [
                    'page creation', 'ui design', 'component development',
                    'responsive design', 'user experience'
                ],
                dependencies: ['navigation', 'auth'],
                outputs: ['web pages', 'ui components', 'design specifications']
            },

            'table-views': {
                name: 'Table Views Agent',
                type: 'ui-agent',
                category: 'data-display',
                expertise: [
                    'Data table creation and management',
                    'Grid layouts and styling',
                    'Sorting and filtering logic',
                    'Data pagination',
                    'Interactive table features',
                    'Export functionality'
                ],
                capabilities: [
                    'Create data tables',
                    'Implement sorting/filtering',
                    'Handle large datasets',
                    'Provide export features',
                    'Create interactive grids',
                    'Optimize table performance'
                ],
                optimalPrompts: [
                    'Create data table for: {data_type}',
                    'Implement table with sorting/filtering for: {entity}',
                    'Design interactive grid display for: {dataset}',
                    'Optimize table performance for: {data_volume}'
                ],
                commonTasks: [
                    'table creation', 'data display', 'sorting/filtering',
                    'data pagination', 'export functionality'
                ],
                dependencies: ['sql-mcp', 'transactions'],
                outputs: ['data tables', 'grid components', 'display specifications']
            },

            'visualizations': {
                name: 'Visualizations Agent',
                type: 'ui-agent',
                category: 'data-visualization',
                expertise: [
                    'Chart and graph creation',
                    'Dashboard design',
                    'Interactive visualizations',
                    'Data storytelling',
                    'Visual analytics',
                    'Real-time data displays'
                ],
                capabilities: [
                    'Create various chart types',
                    'Design dashboards',
                    'Build interactive visuals',
                    'Implement real-time updates',
                    'Create data stories',
                    'Optimize visual performance'
                ],
                optimalPrompts: [
                    'Create visualization for: {data_type}',
                    'Design dashboard showing: {metrics}',
                    'Build interactive chart for: {analysis}',
                    'Create real-time display of: {live_data}'
                ],
                commonTasks: [
                    'chart creation', 'dashboard design', 'data visualization',
                    'interactive displays', 'real-time updates'
                ],
                dependencies: ['sql-mcp', 'transactions'],
                outputs: ['charts', 'dashboards', 'visual components']
            },

            'navigation': {
                name: 'Navigation Agent',
                type: 'ui-agent',
                category: 'user-interface',
                expertise: [
                    'Site navigation design',
                    'Menu system creation',
                    'User flow optimization',
                    'Breadcrumb implementation',
                    'Search functionality',
                    'Mobile navigation'
                ],
                capabilities: [
                    'Design navigation systems',
                    'Create menu structures',
                    'Implement search features',
                    'Optimize user flows',
                    'Handle mobile navigation',
                    'Create breadcrumbs'
                ],
                optimalPrompts: [
                    'Design navigation for: {site_structure}',
                    'Create menu system with: {navigation_requirements}',
                    'Implement search functionality for: {content_type}',
                    'Optimize user flow for: {user_journey}'
                ],
                commonTasks: [
                    'navigation design', 'menu creation', 'search implementation',
                    'user flow optimization', 'mobile navigation'
                ],
                dependencies: ['auth', 'frontend-pages'],
                outputs: ['navigation components', 'menu systems', 'search features']
            },

            // System Agents
            'auth': {
                name: 'Auth Agent',
                type: 'system-agent',
                category: 'security',
                expertise: [
                    'Authentication system design',
                    'Authorization and permissions',
                    'Security protocol implementation',
                    'User session management',
                    'Password security',
                    'Multi-factor authentication'
                ],
                capabilities: [
                    'Implement login systems',
                    'Manage user permissions',
                    'Handle secure sessions',
                    'Enforce security policies',
                    'Implement MFA',
                    'Audit security events'
                ],
                optimalPrompts: [
                    'Implement authentication for: {application}',
                    'Design permission system for: {user_roles}',
                    'Enhance security with: {security_requirements}',
                    'Audit and improve security for: {system_component}'
                ],
                commonTasks: [
                    'authentication', 'authorization', 'security implementation',
                    'session management', 'user permissions'
                ],
                dependencies: [],
                outputs: ['auth systems', 'security policies', 'audit reports']
            },

            'backend-control': {
                name: 'Backend Control Agent',
                type: 'system-agent',
                category: 'administration',
                expertise: [
                    'Admin panel creation',
                    'System configuration management',
                    'Control panel design',
                    'System monitoring',
                    'Configuration interfaces',
                    'Administrative workflows'
                ],
                capabilities: [
                    'Create admin interfaces',
                    'Manage system settings',
                    'Design control panels',
                    'Monitor system health',
                    'Handle configurations',
                    'Implement admin workflows'
                ],
                optimalPrompts: [
                    'Create admin panel for: {management_area}',
                    'Design control interface for: {system_component}',
                    'Implement system monitoring for: {metrics}',
                    'Build configuration management for: {settings}'
                ],
                commonTasks: [
                    'admin panel creation', 'system configuration', 'control interfaces',
                    'system monitoring', 'administrative tools'
                ],
                dependencies: ['auth', 'api-bridge'],
                outputs: ['admin panels', 'control interfaces', 'monitoring tools']
            },

            'api-bridge': {
                name: 'API Bridge Agent',
                type: 'system-agent',
                category: 'integration',
                expertise: [
                    'REST API development',
                    'Data integration patterns',
                    'Service orchestration',
                    'API gateway implementation',
                    'External service integration',
                    'Data synchronization'
                ],
                capabilities: [
                    'Create REST APIs',
                    'Integrate external services',
                    'Handle data synchronization',
                    'Implement API gateways',
                    'Manage service connections',
                    'Handle API security'
                ],
                optimalPrompts: [
                    'Create API for: {functionality}',
                    'Integrate with external service: {service_name}',
                    'Implement data bridge between: {systems}',
                    'Design API gateway for: {service_architecture}'
                ],
                commonTasks: [
                    'api development', 'service integration', 'data bridging',
                    'api gateway', 'external connections'
                ],
                dependencies: ['auth', 'backend-control'],
                outputs: ['apis', 'integration services', 'data bridges']
            }
        };
    }

    loadTrainingPatterns() {
        return {
            // Request analysis patterns
            dataProcessingPatterns: [
                { keywords: ['excel', 'xlsx', 'spreadsheet', 'csv'], agents: ['excel-mcp', 'transactions'] },
                { keywords: ['import', 'export', 'data', 'database'], agents: ['sql-mcp', 'transactions'] },
                { keywords: ['validate', 'clean', 'process'], agents: ['transactions', 'gap-analyzer'] },
                { keywords: ['analyze', 'assessment', 'evaluation'], agents: ['gap-analyzer', 'router'] }
            ],

            uiPatterns: [
                { keywords: ['display', 'show', 'view', 'interface'], agents: ['frontend-pages', 'table-views'] },
                { keywords: ['table', 'grid', 'list'], agents: ['table-views'] },
                { keywords: ['chart', 'graph', 'dashboard', 'visual'], agents: ['visualizations'] },
                { keywords: ['navigation', 'menu', 'breadcrumb'], agents: ['navigation'] }
            ],

            systemPatterns: [
                { keywords: ['auth', 'login', 'security', 'permission'], agents: ['auth'] },
                { keywords: ['admin', 'control', 'configuration', 'settings'], agents: ['backend-control'] },
                { keywords: ['api', 'service', 'integration', 'external'], agents: ['api-bridge'] }
            ],

            workflowPatterns: [
                {
                    scenario: 'excel_to_database',
                    sequence: ['excel-mcp', 'transactions', 'sql-mcp', 'gap-analyzer'],
                    description: 'Excel data import workflow'
                },
                {
                    scenario: 'data_dashboard',
                    sequence: ['sql-mcp', 'transactions', 'visualizations', 'frontend-pages'],
                    description: 'Data dashboard creation workflow'
                },
                {
                    scenario: 'user_management',
                    sequence: ['auth', 'backend-control', 'frontend-pages', 'api-bridge'],
                    description: 'User management system workflow'
                }
            ]
        };
    }

    loadOrchestrationTemplates() {
        return {
            // Common orchestration templates
            dataImportTemplate: {
                name: 'Data Import Workflow',
                description: 'Template for importing data from external sources',
                steps: [
                    { agent: 'gap-analyzer', action: 'analyze_requirements', prompt: 'Analyze data import requirements and identify potential issues' },
                    { agent: 'excel-mcp', action: 'extract_data', prompt: 'Extract and validate data from source file' },
                    { agent: 'transactions', action: 'validate_clean', prompt: 'Validate and clean extracted data according to business rules' },
                    { agent: 'sql-mcp', action: 'import_data', prompt: 'Import validated data into target database' },
                    { agent: 'gap-analyzer', action: 'verify_completion', prompt: 'Verify import completion and assess any remaining gaps' }
                ]
            },

            dashboardTemplate: {
                name: 'Dashboard Creation Workflow',
                description: 'Template for creating data dashboards',
                steps: [
                    { agent: 'gap-analyzer', action: 'analyze_requirements', prompt: 'Analyze dashboard requirements and data visualization needs' },
                    { agent: 'sql-mcp', action: 'prepare_data', prompt: 'Query and prepare data for visualization' },
                    { agent: 'visualizations', action: 'create_charts', prompt: 'Create appropriate charts and visual components' },
                    { agent: 'frontend-pages', action: 'build_dashboard', prompt: 'Build dashboard page integrating all visual components' },
                    { agent: 'navigation', action: 'integrate_navigation', prompt: 'Integrate dashboard into site navigation' }
                ]
            },

            securityTemplate: {
                name: 'Security Implementation Workflow',
                description: 'Template for implementing security features',
                steps: [
                    { agent: 'gap-analyzer', action: 'security_assessment', prompt: 'Assess current security posture and identify vulnerabilities' },
                    { agent: 'auth', action: 'implement_auth', prompt: 'Implement authentication and authorization systems' },
                    { agent: 'api-bridge', action: 'secure_apis', prompt: 'Implement API security measures and access controls' },
                    { agent: 'backend-control', action: 'admin_security', prompt: 'Create secure administrative interfaces and controls' },
                    { agent: 'gap-analyzer', action: 'verify_security', prompt: 'Verify security implementation and identify remaining gaps' }
                ]
            }
        };
    }

    /**
     * Analyze a user request and create an orchestration plan
     */
    analyzeRequest(userRequest) {
        const analysis = {
            originalRequest: userRequest,
            requestType: this.classifyRequest(userRequest),
            identifiedAgents: [],
            orchestrationPlan: [],
            missingCapabilities: [],
            confidence: 0,
            recommendations: []
        };

        // Analyze request against patterns
        const requestLower = userRequest.toLowerCase();
        const identifiedAgents = new Set();

        // Check data processing patterns
        this.trainingPatterns.dataProcessingPatterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => requestLower.includes(keyword))) {
                pattern.agents.forEach(agent => identifiedAgents.add(agent));
            }
        });

        // Check UI patterns
        this.trainingPatterns.uiPatterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => requestLower.includes(keyword))) {
                pattern.agents.forEach(agent => identifiedAgents.add(agent));
            }
        });

        // Check system patterns
        this.trainingPatterns.systemPatterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => requestLower.includes(keyword))) {
                pattern.agents.forEach(agent => identifiedAgents.add(agent));
            }
        });

        analysis.identifiedAgents = Array.from(identifiedAgents);

        // Create orchestration plan
        analysis.orchestrationPlan = this.createOrchestrationPlan(analysis.identifiedAgents, userRequest);

        // Check for missing capabilities
        analysis.missingCapabilities = this.detectMissingCapabilities(userRequest, analysis.identifiedAgents);

        // Calculate confidence
        analysis.confidence = this.calculateConfidence(analysis);

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    classifyRequest(request) {
        const requestLower = request.toLowerCase();

        if (requestLower.includes('import') && requestLower.includes('excel')) {
            return 'data_import';
        } else if (requestLower.includes('dashboard') || requestLower.includes('visualization')) {
            return 'dashboard_creation';
        } else if (requestLower.includes('auth') || requestLower.includes('security')) {
            return 'security_implementation';
        } else if (requestLower.includes('table') || requestLower.includes('display')) {
            return 'data_display';
        } else if (requestLower.includes('api') || requestLower.includes('integration')) {
            return 'api_integration';
        } else {
            return 'general_task';
        }
    }

    createOrchestrationPlan(agents, userRequest) {
        const plan = [];

        // Order agents based on typical workflow patterns
        const orderedAgents = this.orderAgents(agents, userRequest);

        orderedAgents.forEach((agentId, index) => {
            const agent = this.agentRegistry[agentId];
            if (agent) {
                const prompt = this.generateOptimalPrompt(agentId, userRequest, index);
                plan.push({
                    step: index + 1,
                    agent: agentId,
                    agentName: agent.name,
                    agentType: agent.type,
                    prompt: prompt,
                    reason: this.generateReason(agentId, userRequest),
                    dependencies: agent.dependencies || [],
                    expectedOutput: agent.outputs ? agent.outputs[0] : 'processed result'
                });
            }
        });

        return plan;
    }

    orderAgents(agents, userRequest) {
        // Define typical workflow orders
        const workflowOrders = {
            data_import: ['gap-analyzer', 'excel-mcp', 'transactions', 'sql-mcp'],
            dashboard_creation: ['gap-analyzer', 'sql-mcp', 'visualizations', 'frontend-pages', 'navigation'],
            security_implementation: ['gap-analyzer', 'auth', 'api-bridge', 'backend-control'],
            data_display: ['sql-mcp', 'transactions', 'table-views', 'frontend-pages']
        };

        const requestType = this.classifyRequest(userRequest);
        const preferredOrder = workflowOrders[requestType] || [];

        // Sort agents based on preferred order, then by type priority
        const typePriority = {
            'meta-agent': 1,
            'data-agent': 2,
            'ui-agent': 3,
            'system-agent': 4
        };

        return agents.sort((a, b) => {
            const aOrderIndex = preferredOrder.indexOf(a);
            const bOrderIndex = preferredOrder.indexOf(b);

            if (aOrderIndex !== -1 && bOrderIndex !== -1) {
                return aOrderIndex - bOrderIndex;
            } else if (aOrderIndex !== -1) {
                return -1;
            } else if (bOrderIndex !== -1) {
                return 1;
            } else {
                const aAgent = this.agentRegistry[a];
                const bAgent = this.agentRegistry[b];
                return typePriority[aAgent.type] - typePriority[bAgent.type];
            }
        });
    }

    generateOptimalPrompt(agentId, userRequest, stepIndex) {
        const agent = this.agentRegistry[agentId];
        if (!agent) return userRequest;

        // Use agent's optimal prompts as templates
        const templates = agent.optimalPrompts || [];

        // Select appropriate template based on request content
        let selectedTemplate = templates[0] || 'Handle the following request: {request}';

        // Customize template based on request content and step position
        if (stepIndex === 0) {
            // First step - usually analysis or preparation
            selectedTemplate = selectedTemplate.replace('{filename}', 'the provided file');
            selectedTemplate = selectedTemplate.replace('{description}', userRequest);
            selectedTemplate = selectedTemplate.replace('{request}', userRequest);
        }

        return selectedTemplate.replace('{request}', userRequest);
    }

    generateReason(agentId, userRequest) {
        const agent = this.agentRegistry[agentId];
        if (!agent) return 'Agent needed for task completion';

        const requestLower = userRequest.toLowerCase();

        // Generate contextual reason based on agent expertise and request content
        for (const expertise of agent.expertise) {
            const expertiseLower = expertise.toLowerCase();
            if (requestLower.includes(expertiseLower.split(' ')[0])) {
                return `${agent.name} needed for ${expertise.toLowerCase()}`;
            }
        }

        return `${agent.name} needed for ${agent.category} operations`;
    }

    detectMissingCapabilities(request, identifiedAgents) {
        const missing = [];
        const requestLower = request.toLowerCase();

        // Check for capabilities mentioned in request but not covered by identified agents
        const allCapabilities = new Set();
        identifiedAgents.forEach(agentId => {
            const agent = this.agentRegistry[agentId];
            if (agent) {
                agent.capabilities.forEach(cap => allCapabilities.add(cap.toLowerCase()));
            }
        });

        // Common missing capability patterns
        if (requestLower.includes('email') && !Array.from(allCapabilities).some(cap => cap.includes('email'))) {
            missing.push('Email notification agent needed for email functionality');
        }

        if (requestLower.includes('schedule') && !Array.from(allCapabilities).some(cap => cap.includes('schedule'))) {
            missing.push('Scheduler agent needed for task scheduling');
        }

        if (requestLower.includes('report') && !identifiedAgents.includes('visualizations')) {
            missing.push('Consider using visualizations agent for report generation');
        }

        return missing;
    }

    calculateConfidence(analysis) {
        let confidence = 0;

        // Base confidence on number of identified agents
        if (analysis.identifiedAgents.length > 0) confidence += 30;
        if (analysis.identifiedAgents.length > 2) confidence += 20;

        // Increase confidence if we have a clear workflow pattern
        if (analysis.orchestrationPlan.length > 1) confidence += 25;

        // Increase confidence if missing capabilities are low
        if (analysis.missingCapabilities.length === 0) confidence += 25;

        return Math.min(confidence, 100);
    }

    generateRecommendations(analysis) {
        const recommendations = [];

        if (analysis.confidence < 70) {
            recommendations.push('Consider providing more specific details about your requirements');
        }

        if (analysis.missingCapabilities.length > 0) {
            recommendations.push('Review missing capabilities and consider creating additional agents if needed');
        }

        if (analysis.identifiedAgents.length === 1) {
            recommendations.push('Single agent task - consider if additional validation or UI agents are needed');
        }

        if (analysis.identifiedAgents.length > 5) {
            recommendations.push('Complex workflow - consider breaking into smaller sub-tasks');
        }

        return recommendations;
    }

    /**
     * Generate training report
     */
    generateTrainingReport() {
        const report = {
            timestamp: new Date().toISOString(),
            agentRegistry: {
                totalAgents: Object.keys(this.agentRegistry).length,
                agentsByType: {},
                agentsByCategory: {}
            },
            trainingPatterns: {
                dataProcessingPatterns: this.trainingPatterns.dataProcessingPatterns.length,
                uiPatterns: this.trainingPatterns.uiPatterns.length,
                systemPatterns: this.trainingPatterns.systemPatterns.length,
                workflowPatterns: this.trainingPatterns.workflowPatterns.length
            },
            orchestrationTemplates: Object.keys(this.orchestrationTemplates).length
        };

        // Count agents by type and category
        Object.values(this.agentRegistry).forEach(agent => {
            report.agentRegistry.agentsByType[agent.type] =
                (report.agentRegistry.agentsByType[agent.type] || 0) + 1;
            report.agentRegistry.agentsByCategory[agent.category] =
                (report.agentRegistry.agentsByCategory[agent.category] || 0) + 1;
        });

        return report;
    }

    /**
     * Save trained orchestrator configuration
     */
    saveTrainedConfiguration(filename = 'ao_trained_config.json') {
        const config = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            agentRegistry: this.agentRegistry,
            trainingPatterns: this.trainingPatterns,
            orchestrationTemplates: this.orchestrationTemplates,
            metadata: {
                totalAgents: Object.keys(this.agentRegistry).length,
                trainingComplete: true,
                capabilities: [
                    'Request analysis and agent selection',
                    'Optimal prompt generation',
                    'Missing capability detection',
                    'Workflow orchestration',
                    'Agent dependency management'
                ]
            }
        };

        fs.writeFileSync(filename, JSON.stringify(config, null, 2));
        console.log(`✅ Trained AO configuration saved to: ${filename}`);
        return filename;
    }
}

// Export for use in other modules
module.exports = AOAgentTrainer;

// CLI execution
if (require.main === module) {
    const trainer = new AOAgentTrainer();

    console.log('🎓 AO Agent Training System');
    console.log('═══════════════════════════════════════════════════════');

    // Generate training report
    const report = trainer.generateTrainingReport();
    console.log('📊 Training Report:');
    console.log(`   Total Agents: ${report.agentRegistry.totalAgents}`);
    console.log(`   Agent Types: ${Object.keys(report.agentRegistry.agentsByType).join(', ')}`);
    console.log(`   Training Patterns: ${Object.keys(report.trainingPatterns).length}`);
    console.log(`   Orchestration Templates: ${report.orchestrationTemplates}`);

    // Save trained configuration
    trainer.saveTrainedConfiguration();

    console.log('');
    console.log('✅ AO Agent training complete!');
    console.log('🎯 The AO agent is now trained to:');
    console.log('   - Analyze user requests and select optimal agents');
    console.log('   - Generate targeted prompts for each agent');
    console.log('   - Detect missing capabilities and gaps');
    console.log('   - Orchestrate complex multi-agent workflows');
    console.log('   - Provide confidence ratings and recommendations');
}