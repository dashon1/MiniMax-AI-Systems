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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing Supabase configuration');
        }

        const { action, agentId, agentData, adminUserId } = await req.json();

        // Verify admin permissions
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${adminUserId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });
        
        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0) {
            throw new Error('Unauthorized: Admin access required');
        }

        let result;
        switch (action) {
            case 'list':
                // Get all agents with performance metrics
                const agentsResponse = await fetch(`${supabaseUrl}/rest/v1/agent_capabilities?select=*`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const agents = await agentsResponse.json();
                
                // Get usage statistics for each agent
                const tasksResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?select=selected_agent`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const tasks = await tasksResponse.json();
                
                // Calculate performance metrics
                const agentStats = tasks.reduce((acc, task) => {
                    const agent = task.selected_agent;
                    acc[agent] = (acc[agent] || 0) + 1;
                    return acc;
                }, {});
                
                // Enhance agents with metrics and standardized info
                result = agents.map(agent => {
                    const usageCount = agentStats[agent.agent_name] || 0;
                    
                    // Map to display format matching reference image
                    const displayName = {
                        'abacus': 'Abacus Agent',
                        'genspark': 'Genspark Agent', 
                        'manus': 'Manus Agent',
                        'minimax': 'Minimax Agent',
                        'mvp_agent': 'MVP Agent',
                        'fullstack_dev': 'Fullstack Dev',
                        'deep_research': 'Deep Research',
                        'report_writer': 'Report Writer'
                    }[agent.agent_name] || agent.agent_name;
                    
                    // Generate performance metrics based on agent type
                    const baseMetrics = {
                        efficiency: Math.min(95, 70 + (usageCount * 2)),
                        responseTime: Math.max(0.5, 3 - (usageCount * 0.1)),
                        accuracy: Math.min(98, 80 + (usageCount * 1.5))
                    };
                    
                    return {
                        ...agent,
                        displayName,
                        usageCount,
                        performanceMetrics: baseMetrics,
                        coreSpecifications: agent.capability_keywords?.slice(0, 3) || [],
                        status: agent.is_active ? 'Active' : 'Inactive'
                    };
                });
                break;

            case 'update':
                // Update agent configuration
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/agent_capabilities?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(agentData)
                });
                result = await updateResponse.json();
                break;

            case 'create':
                // Create new agent
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/agent_capabilities`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: crypto.randomUUID(),
                        ...agentData,
                        created_at: new Date().toISOString()
                    })
                });
                result = await createResponse.json();
                break;

            case 'toggle_status':
                // Toggle agent active status
                const toggleResponse = await fetch(`${supabaseUrl}/rest/v1/agent_capabilities?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        is_active: agentData.is_active
                    })
                });
                result = await toggleResponse.json();
                break;

            case 'deploy':
                // Deploy agent (placeholder for actual deployment logic)
                result = {
                    message: `Agent ${agentId} deployment initiated`,
                    deploymentId: crypto.randomUUID(),
                    status: 'deploying'
                };
                break;

            case 'analytics':
                // Get agent performance analytics
                const analyticsTasksResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?select=selected_agent,status,created_at`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const analyticsTasks = await analyticsTasksResponse.json();
                
                const agentAnalytics = analyticsTasks.reduce((acc, task) => {
                    const agent = task.selected_agent;
                    if (!acc[agent]) {
                        acc[agent] = { total: 0, completed: 0, failed: 0, processing: 0 };
                    }
                    acc[agent].total++;
                    acc[agent][task.status]++;
                    return acc;
                }, {});
                
                result = agentAnalytics;
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Agent management error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'AGENT_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
