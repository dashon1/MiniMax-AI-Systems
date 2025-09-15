Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { taskContent, manualAgentOverride, userPreferences = {} } = await req.json();

        console.log('Task routing request:', { taskContent: taskContent?.substring(0, 100) });

        if (!taskContent || taskContent.trim().length === 0) {
            throw new Error('Task content is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        // If manual override is specified, validate and use it
        if (manualAgentOverride) {
            const validAgents = ['genspark', 'abacus', 'minimax', 'manus'];
            if (!validAgents.includes(manualAgentOverride)) {
                throw new Error(`Invalid agent override: ${manualAgentOverride}`);
            }

            return new Response(JSON.stringify({
                data: {
                    selectedAgent: manualAgentOverride,
                    reasoning: `User manually selected ${manualAgentOverride} agent`,
                    confidence: 1.0,
                    alternatives: [],
                    routingMethod: 'manual_override'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Fetch agent capabilities from database
        const capabilitiesResponse = await fetch(`${supabaseUrl}/rest/v1/agent_capabilities?is_active=eq.true&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        if (!capabilitiesResponse.ok) {
            throw new Error('Failed to fetch agent capabilities');
        }

        const agents = await capabilitiesResponse.json();
        console.log('Available agents:', agents.length);

        if (!agents || agents.length === 0) {
            throw new Error('No active agents available');
        }

        // Analyze task content and calculate scores for each agent
        const taskContentLower = taskContent.toLowerCase();
        const agentScores = [];

        for (const agent of agents) {
            let score = 0;
            let reasoning = [];

            // Keyword matching score (0-40 points)
            let keywordMatches = 0;
            for (const keyword of agent.capability_keywords) {
                if (taskContentLower.includes(keyword.toLowerCase())) {
                    keywordMatches++;
                    score += 8; // Up to 40 points for keyword matches
                }
            }
            if (keywordMatches > 0) {
                reasoning.push(`Found ${keywordMatches} keyword matches`);
            }

            // Task complexity analysis (0-25 points)
            const complexityIndicators = [
                'complex', 'advanced', 'detailed', 'comprehensive', 'technical', 'professional',
                'analyze', 'research', 'develop', 'create', 'design', 'optimize', 'implement'
            ];
            let complexityScore = 0;
            for (const indicator of complexityIndicators) {
                if (taskContentLower.includes(indicator)) {
                    complexityScore += 3;
                }
            }
            complexityScore = Math.min(complexityScore, 25);
            score += complexityScore;

            // Agent-specific bonus scoring (0-20 points)
            if (agent.agent_name === 'genspark' && 
                (taskContentLower.includes('research') || taskContentLower.includes('information') || 
                 taskContentLower.includes('article') || taskContentLower.includes('content'))) {
                score += 20;
                reasoning.push('Research and content specialization bonus');
            }

            if (agent.agent_name === 'abacus' && 
                (taskContentLower.includes('code') || taskContentLower.includes('programming') || 
                 taskContentLower.includes('technical') || taskContentLower.includes('data') ||
                 taskContentLower.includes('algorithm') || taskContentLower.includes('develop'))) {
                score += 20;
                reasoning.push('Technical development specialization bonus');
            }

            if (agent.agent_name === 'minimax' && 
                (taskContentLower.includes('creative') || taskContentLower.includes('design') || 
                 taskContentLower.includes('visual') || taskContentLower.includes('video') ||
                 taskContentLower.includes('image') || taskContentLower.includes('art'))) {
                score += 20;
                reasoning.push('Creative content specialization bonus');
            }

            if (agent.agent_name === 'manus' && 
                (taskContentLower.includes('business') || taskContentLower.includes('strategy') || 
                 taskContentLower.includes('workflow') || taskContentLower.includes('optimize') ||
                 taskContentLower.includes('automation') || taskContentLower.includes('enterprise'))) {
                score += 20;
                reasoning.push('Business strategy specialization bonus');
            }

            // Cost optimization preference (0-10 points)
            if (userPreferences.preferLowerCost && agent.pricing_model === 'subscription') {
                score += 10;
                reasoning.push('Cost optimization preference applied');
            }

            // User historical preferences (0-5 points)
            if (userPreferences.preferredAgent === agent.agent_name) {
                score += 5;
                reasoning.push('User preference bonus');
            }

            agentScores.push({
                agent: agent.agent_name,
                score,
                reasoning: reasoning.join('; '),
                description: agent.description,
                confidence: Math.min(score / 100, 1.0) // Normalize to 0-1
            });
        }

        // Sort by score descending
        agentScores.sort((a, b) => b.score - a.score);
        
        const selectedAgent = agentScores[0];
        const alternatives = agentScores.slice(1, 3); // Top 2 alternatives

        console.log('Agent selection result:', {
            selected: selectedAgent.agent,
            score: selectedAgent.score,
            confidence: selectedAgent.confidence
        });

        return new Response(JSON.stringify({
            data: {
                selectedAgent: selectedAgent.agent,
                reasoning: selectedAgent.reasoning || `Best match based on task analysis (score: ${selectedAgent.score})`,
                confidence: selectedAgent.confidence,
                alternatives: alternatives.map(alt => ({
                    agent: alt.agent,
                    score: alt.score,
                    reasoning: alt.reasoning
                })),
                routingMethod: 'intelligent_analysis'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Task routing error:', error);

        const errorResponse = {
            error: {
                code: 'TASK_ROUTING_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});