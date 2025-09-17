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

        const { userId, action } = await req.json();

        if (!userId) {
            throw new Error('User ID is required');
        }

        let result;
        switch (action) {
            case 'dashboard':
                // Get user dashboard data
                const [userResponse, creditsResponse, tasksResponse, agentsResponse] = await Promise.all([
                    fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    }),
                    fetch(`${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=1`, {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    }),
                    fetch(`${supabaseUrl}/rest/v1/tasks?user_id=eq.${userId}&order=created_at.desc&limit=10`, {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    }),
                    fetch(`${supabaseUrl}/rest/v1/agent_capabilities?is_active=eq.true`, {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    })
                ]);

                const [user, lastCredit, userTasks, availableAgents] = await Promise.all([
                    userResponse.json(),
                    creditsResponse.json(),
                    tasksResponse.json(),
                    agentsResponse.json()
                ]);

                if (!user || user.length === 0) {
                    throw new Error('User not found');
                }

                const userData = user[0];
                const currentBalance = lastCredit.length > 0 ? lastCredit[0].balance_after : 0;

                // Get task statistics
                const allUserTasksResponse = await fetch(`${supabaseUrl}/rest/v1/tasks?user_id=eq.${userId}`, {
                    headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                });
                const allUserTasks = await allUserTasksResponse.json();

                const taskStats = {
                    total: allUserTasks.length,
                    completed: allUserTasks.filter(t => t.status === 'completed').length,
                    processing: allUserTasks.filter(t => t.status === 'processing').length,
                    failed: allUserTasks.filter(t => t.status === 'failed').length
                };

                result = {
                    user: userData,
                    credits: {
                        balance: currentBalance,
                        monthlyLimit: userData.monthly_limit || 100
                    },
                    tasks: {
                        recent: userTasks,
                        statistics: taskStats
                    },
                    agents: availableAgents.map(agent => ({
                        id: agent.id,
                        name: agent.agent_name,
                        displayName: {
                            'abacus': 'Abacus Agent',
                            'genspark': 'Genspark Agent', 
                            'manus': 'Manus Agent',
                            'minimax': 'Minimax Agent',
                            'mvp_agent': 'MVP Agent',
                            'fullstack_dev': 'Fullstack Dev',
                            'deep_research': 'Deep Research',
                            'report_writer': 'Report Writer'
                        }[agent.agent_name] || agent.agent_name,
                        description: agent.description,
                        capabilities: agent.capability_keywords
                    }))
                };
                break;

            case 'create_task':
                const { taskContent, selectedAgent, priority = 'normal' } = req.body;
                
                // Create new task
                const createTaskResponse = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: crypto.randomUUID(),
                        user_id: userId,
                        task_content: taskContent,
                        selected_agent: selectedAgent,
                        priority: priority,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    })
                });
                
                result = await createTaskResponse.json();
                break;

            case 'credit_history':
                // Get detailed credit history
                const creditHistoryResponse = await fetch(
                    `${supabaseUrl}/rest/v1/credit_transactions?user_id=eq.${userId}&order=created_at.desc&limit=50`,
                    {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    }
                );
                result = await creditHistoryResponse.json();
                break;

            case 'task_history':
                // Get detailed task history
                const taskHistoryResponse = await fetch(
                    `${supabaseUrl}/rest/v1/tasks?user_id=eq.${userId}&order=created_at.desc&limit=50`,
                    {
                        headers: { 'Authorization': `Bearer ${serviceRoleKey}`, 'apikey': serviceRoleKey }
                    }
                );
                result = await taskHistoryResponse.json();
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User dashboard error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'USER_DASHBOARD_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
