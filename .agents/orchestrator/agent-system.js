#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AgentSystem {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
        this.agents = new Map();
        this.agentsDir = path.join(__dirname, '..');
    }

    async loadAllAgents() {
        const agentDefinitions = {
            // UI Agents
            'frontend-pages': {
                path: 'ui-agents/frontend-pages',
                type: 'ui-agent',
                name: 'Frontend Pages Agent',
                description: 'Regular application pages (home, about, user profiles, etc.)'
            },
            'table-views': {
                path: 'ui-agents/table-views',
                type: 'ui-agent', 
                name: 'Table Views Agent',
                description: 'All data tables, grids, list views with sorting/filtering'
            },
            'visualizations': {
                path: 'ui-agents/visualizations',
                type: 'ui-agent',
                name: 'Visualizations Agent',
                description: 'Charts, graphs, dashboards, KPI displays'
            },
            'navigation': {
                path: 'ui-agents/navigation',
                type: 'ui-agent',
                name: 'Navigation Agent',
                description: 'Sidebar menus, top ribbon/toolbar, breadcrumbs'
            },
            
            // Data Agents
            'sql-mcp': {
                path: 'data-agents/sql-mcp',
                type: 'data-agent',
                name: 'SQL MCP Agent',
                description: 'Direct SQL Server access through MCP for queries'
            },
            'transactions': {
                path: 'data-agents/transactions',
                type: 'data-agent',
                name: 'Data Transactions Agent',
                description: 'CRUD operations, batch updates, data integrity'
            },
            
            // System Agents
            'auth': {
                path: 'system-agents/auth',
                type: 'system-agent',
                name: 'Authentication Agent',
                description: 'Login, JWT, permissions, role management'
            },
            'backend-control': {
                path: 'system-agents/backend-control',
                type: 'system-agent',
                name: 'Backend Control Agent',
                description: 'Admin panels, settings pages, system config'
            },
            'api-bridge': {
                path: 'system-agents/api-bridge',
                type: 'system-agent',
                name: 'API Bridge Agent',
                description: 'REST/GraphQL endpoints, state management, data flow'
            },
            
            // Meta Agents
            'gap-analyzer': {
                path: 'meta-agents/gap-analyzer',
                type: 'meta-agent',
                name: 'Gap Analyzer Agent',
                description: 'Finds missing features, integration issues'
            }
        };

        for (const [agentId, definition] of Object.entries(agentDefinitions)) {
            try {
                const agentPath = path.join(this.agentsDir, definition.path);
                const configPath = path.join(agentPath, 'config.json');
                const claudeConfigPath = path.join(agentPath, '.claude-code');

                const [config, claudeConfig] = await Promise.all([
                    fs.readFile(configPath, 'utf8').then(JSON.parse),
                    fs.readFile(claudeConfigPath, 'utf8').then(JSON.parse)
                ]);

                this.agents.set(agentId, {
                    id: agentId,
                    name: definition.name,
                    type: definition.type,
                    description: definition.description,
                    systemPrompt: claudeConfig.systemPrompt || '',
                    expertise: config.expertise || [],
                    responsibilities: config.responsibilities || [],
                    consultationPermissions: config.consultationPermissions || {},
                    filePatterns: config.filePatterns || {}
                });
            } catch (error) {
                console.error(`Error loading agent ${agentId}:`, error.message);
            }
        }
    }

    canConsult(requestingAgent, targetAgent) {
        if (!this.agents.has(requestingAgent) || !this.agents.has(targetAgent)) {
            return false;
        }

        const requesting = this.agents.get(requestingAgent);
        const canConsult = requesting.consultationPermissions.canConsult || [];
        
        return canConsult.includes(targetAgent) || targetAgent === 'gap-analyzer';
    }

    async executeAgentTask(agentId, task, context = {}) {
        if (!this.agents.has(agentId)) {
            return { error: `Agent ${agentId} not found`, success: false };
        }

        const agent = this.agents.get(agentId);
        
        const contextStr = Object.keys(context).length > 0 
            ? `\n\nContext: ${JSON.stringify(context, null, 2)}` 
            : '';

        try {
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: agent.systemPrompt,
                messages: [{
                    role: 'user',
                    content: `Task: ${task}${contextStr}`
                }]
            });

            return {
                agent: agent.name,
                agentId: agentId,
                task: task,
                response: response.content[0].text,
                success: true,
                metadata: {
                    model: 'claude-3-5-sonnet-20241022',
                    agentType: agent.type
                }
            };
        } catch (error) {
            return {
                agent: agent.name,
                agentId: agentId,
                task: task,
                error: error.message,
                success: false
            };
        }
    }

    async consultAgent(requestingAgent, targetAgent, query, context = {}) {
        if (!this.canConsult(requestingAgent, targetAgent)) {
            return {
                respondingAgent: targetAgent,
                response: `Permission denied: ${requestingAgent} cannot consult ${targetAgent}`,
                success: false,
                metadata: { error: 'permission_denied' }
            };
        }

        if (!this.agents.has(targetAgent)) {
            return {
                respondingAgent: targetAgent,
                response: `Agent ${targetAgent} not found`,
                success: false,
                metadata: { error: 'agent_not_found' }
            };
        }

        const target = this.agents.get(targetAgent);
        const requesting = this.agents.get(requestingAgent);

        const consultationPrompt = `
INTER-AGENT CONSULTATION REQUEST

From: ${requestingAgent} (${requesting.name})
To: ${targetAgent} (${target.name})

Query: ${query}

Context: ${Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : 'None'}

Please provide focused response based on your expertise in: ${target.expertise.join(', ')}

Your responsibilities include: ${target.responsibilities.join(', ')}

Respond as the ${target.name} with specific, actionable advice.
`;

        try {
            const response = await this.client.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2048,
                system: target.systemPrompt,
                messages: [{
                    role: 'user',
                    content: consultationPrompt
                }]
            });

            return {
                respondingAgent: targetAgent,
                requestId: `${requestingAgent}->${targetAgent}`,
                response: response.content[0].text,
                success: true,
                metadata: {
                    model: 'claude-3-5-sonnet-20241022',
                    consultationType: 'inter_agent'
                }
            };
        } catch (error) {
            return {
                respondingAgent: targetAgent,
                response: `Error during consultation: ${error.message}`,
                success: false,
                metadata: { error: 'consultation_failed', exception: error.message }
            };
        }
    }

    listAgents() {
        return Array.from(this.agents.entries()).map(([id, agent]) => ({
            id,
            name: agent.name,
            type: agent.type,
            description: agent.description,
            expertise: agent.expertise
        }));
    }

    getConsultationMatrix() {
        const matrix = {};
        for (const [agentId, agent] of this.agents) {
            matrix[agentId] = agent.consultationPermissions.canConsult || [];
        }
        return matrix;
    }
}

export default AgentSystem;