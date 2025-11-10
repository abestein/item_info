const fs = require('fs');
const path = require('path');

class AgentRouter {
    constructor() {
        this.config = this.loadConfig();
        this.availableAgents = this.discoverAgents();
        this.routingHistory = [];
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('Failed to load router config:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            routing_rules: {
                general_tasks: {
                    keywords: ["help", "assist"],
                    target_agent: "orchestrator",
                    confidence_threshold: 0.5
                }
            },
            fallback_agent: "orchestrator",
            max_routing_attempts: 3
        };
    }

    discoverAgents() {
        const agents = new Map();
        const agentsDir = path.join(__dirname, '../..');
        
        try {
            // Discover data agents
            const dataAgentsDir = path.join(agentsDir, 'data-agents');
            if (fs.existsSync(dataAgentsDir)) {
                const dataAgents = fs.readdirSync(dataAgentsDir);
                dataAgents.forEach(agentName => {
                    const agentPath = path.join(dataAgentsDir, agentName);
                    if (fs.statSync(agentPath).isDirectory()) {
                        agents.set(agentName, {
                            type: 'data-agent',
                            path: agentPath,
                            config: this.loadAgentConfig(agentPath)
                        });
                    }
                });
            }

            // Discover meta agents
            const metaAgentsDir = path.join(agentsDir, 'meta-agents');
            if (fs.existsSync(metaAgentsDir)) {
                const metaAgents = fs.readdirSync(metaAgentsDir);
                metaAgents.forEach(agentName => {
                    if (agentName !== 'router') { // Don't include self
                        const agentPath = path.join(metaAgentsDir, agentName);
                        if (fs.statSync(agentPath).isDirectory()) {
                            agents.set(agentName, {
                                type: 'meta-agent',
                                path: agentPath,
                                config: this.loadAgentConfig(agentPath)
                            });
                        }
                    }
                });
            }

            // Add orchestrator
            const orchestratorPath = path.join(agentsDir, 'orchestrator');
            if (fs.existsSync(orchestratorPath)) {
                agents.set('orchestrator', {
                    type: 'orchestrator',
                    path: orchestratorPath,
                    config: this.loadAgentConfig(orchestratorPath)
                });
            }

        } catch (error) {
            console.error('Error discovering agents:', error);
        }

        return agents;
    }

    loadAgentConfig(agentPath) {
        try {
            const configPath = path.join(agentPath, 'config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.warn(`Failed to load config for agent at ${agentPath}:`, error);
        }
        return null;
    }

    analyzeRequest(request) {
        const analysis = {
            intent: null,
            confidence: 0,
            keywords: [],
            suggestedAgent: null,
            reasoning: ''
        };

        const requestText = request.toLowerCase();
        const words = requestText.split(/\s+/);
        
        let bestMatch = null;
        let highestScore = 0;

        // Analyze against routing rules
        for (const [ruleKey, rule] of Object.entries(this.config.routing_rules)) {
            let score = 0;
            let matchedKeywords = [];

            // Calculate keyword match score
            for (const keyword of rule.keywords) {
                const keywordLower = keyword.toLowerCase();
                if (requestText.includes(keywordLower)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            }

            // Normalize score by number of keywords
            const normalizedScore = score / rule.keywords.length;

            // Debug logging
            if (process.env.DEBUG_ROUTER) {
                console.log(`Rule: ${ruleKey}, Score: ${score}/${rule.keywords.length} = ${normalizedScore}, Threshold: ${rule.confidence_threshold}, Matched: [${matchedKeywords.join(', ')}]`);
            }

            if (normalizedScore > highestScore && normalizedScore >= rule.confidence_threshold) {
                highestScore = normalizedScore;
                bestMatch = {
                    rule: ruleKey,
                    agent: rule.target_agent,
                    score: normalizedScore,
                    keywords: matchedKeywords
                };
            }
        }

        if (bestMatch) {
            analysis.intent = bestMatch.rule;
            analysis.confidence = bestMatch.score;
            analysis.keywords = bestMatch.keywords;
            analysis.suggestedAgent = bestMatch.agent;
            analysis.reasoning = `Matched rule '${bestMatch.rule}' with confidence ${(bestMatch.score * 100).toFixed(1)}% based on keywords: ${bestMatch.keywords.join(', ')}`;
        } else {
            analysis.suggestedAgent = this.config.fallback_agent;
            analysis.reasoning = 'No specific rules matched, using fallback agent';
        }

        return analysis;
    }

    routeRequest(request, context = {}) {
        const analysis = this.analyzeRequest(request);
        
        // Check if suggested agent is available
        if (!this.availableAgents.has(analysis.suggestedAgent)) {
            console.warn(`Suggested agent '${analysis.suggestedAgent}' not available, falling back to ${this.config.fallback_agent}`);
            analysis.suggestedAgent = this.config.fallback_agent;
        }

        const routingDecision = {
            timestamp: new Date().toISOString(),
            request: request,
            analysis: analysis,
            selectedAgent: analysis.suggestedAgent,
            agentInfo: this.availableAgents.get(analysis.suggestedAgent),
            context: context
        };

        // Store routing history
        this.routingHistory.push(routingDecision);
        
        // Keep only last 100 routing decisions
        if (this.routingHistory.length > 100) {
            this.routingHistory.shift();
        }

        return routingDecision;
    }

    executeRouting(request, context = {}) {
        const routing = this.routeRequest(request, context);
        
        console.log(`[Agent Router] Routing request to: ${routing.selectedAgent}`);
        console.log(`[Agent Router] Reasoning: ${routing.analysis.reasoning}`);

        // Return routing information for external execution
        return {
            agent: routing.selectedAgent,
            agentPath: routing.agentInfo?.path,
            agentType: routing.agentInfo?.type,
            confidence: routing.analysis.confidence,
            reasoning: routing.analysis.reasoning,
            fullRouting: routing
        };
    }

    getAvailableAgents() {
        return Array.from(this.availableAgents.keys());
    }

    getRoutingHistory(limit = 10) {
        return this.routingHistory.slice(-limit);
    }

    getAgentInfo(agentName) {
        return this.availableAgents.get(agentName);
    }
}

module.exports = AgentRouter;

// CLI interface
if (require.main === module) {
    const router = new AgentRouter();
    const request = process.argv.slice(2).join(' ');
    
    if (!request) {
        console.log('Usage: node agent-router.js "your request here"');
        console.log('\nAvailable agents:', router.getAvailableAgents().join(', '));
        process.exit(1);
    }

    const routing = router.executeRouting(request);
    console.log('\n--- Routing Decision ---');
    console.log(JSON.stringify(routing, null, 2));
}