// API Integration Manager - Central hub for managing all API integrations

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
        const { action, apiName, config, testData } = await req.json();
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('Authorization required');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid authorization');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        switch (action) {
            case 'list_apis':
                return await listAPIs(supabaseUrl, serviceRoleKey, corsHeaders);
            
            case 'get_api_status':
                return await getAPIStatus(supabaseUrl, serviceRoleKey, apiName, corsHeaders);
            
            case 'update_api_config':
                return await updateAPIConfig(supabaseUrl, serviceRoleKey, apiName, config, corsHeaders);
            
            case 'test_api_connection':
                return await testAPIConnection(supabaseUrl, serviceRoleKey, apiName, testData, userId, corsHeaders);
            
            case 'get_usage_stats':
                return await getUsageStats(supabaseUrl, serviceRoleKey, apiName, userId, corsHeaders);
            
            case 'health_check_all':
                return await healthCheckAllAPIs(supabaseUrl, serviceRoleKey, corsHeaders);
            
            default:
                throw new Error('Invalid action specified');
        }

    } catch (error) {
        console.error('API Integration Manager error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'API_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// List all available APIs
async function listAPIs(supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/api_configurations?select=*&order=api_category,display_name`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch API configurations');
    }

    const apis = await response.json();
    
    return new Response(JSON.stringify({ data: apis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Get specific API status
async function getAPIStatus(supabaseUrl: string, serviceRoleKey: string, apiName: string, corsHeaders: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/api_configurations?api_name=eq.${apiName}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch API status');
    }

    const apis = await response.json();
    if (apis.length === 0) {
        throw new Error('API not found');
    }

    // Get recent usage stats
    const usageResponse = await fetch(`${supabaseUrl}/rest/v1/api_usage_logs?api_name=eq.${apiName}&select=*&order=created_at.desc&limit=10`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const recentUsage = usageResponse.ok ? await usageResponse.json() : [];

    return new Response(JSON.stringify({ 
        data: {
            config: apis[0],
            recentUsage: recentUsage
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Update API configuration
async function updateAPIConfig(supabaseUrl: string, serviceRoleKey: string, apiName: string, config: any, corsHeaders: any) {
    const updateData = {
        ...config,
        updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/api_configurations?api_name=eq.${apiName}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (!response.ok) {
        throw new Error('Failed to update API configuration');
    }

    return new Response(JSON.stringify({ 
        data: { message: 'API configuration updated successfully' }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Test API connection
async function testAPIConnection(supabaseUrl: string, serviceRoleKey: string, apiName: string, testData: any, userId: string, corsHeaders: any) {
    // Get API configuration
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/api_configurations?api_name=eq.${apiName}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!configResponse.ok) {
        throw new Error('Failed to fetch API configuration');
    }

    const configs = await configResponse.json();
    if (configs.length === 0) {
        throw new Error('API configuration not found');
    }

    const config = configs[0];
    
    // Perform connection test based on API type
    const testResult = await performConnectionTest(apiName, config, testData);
    
    // Log the test
    await logAPIUsage(supabaseUrl, serviceRoleKey, {
        api_name: apiName,
        user_id: userId,
        endpoint: 'connection_test',
        method: 'GET',
        response_status: testResult.success ? 200 : 500,
        response_time_ms: testResult.responseTime,
        error_message: testResult.error || null
    });

    return new Response(JSON.stringify({ data: testResult }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Perform connection test for specific API
async function performConnectionTest(apiName: string, config: any, testData: any) {
    const startTime = Date.now();
    
    try {
        let testEndpoint = '';
        let testHeaders: any = {};
        
        switch (apiName) {
            case 'openai':
                testEndpoint = 'https://api.openai.com/v1/models';
                testHeaders['Authorization'] = `Bearer ${Deno.env.get('OPENAI_API_KEY')}`;
                break;
                
            case 'discord':
                testEndpoint = 'https://discord.com/api/v10/users/@me';
                testHeaders['Authorization'] = `Bot ${Deno.env.get('DISCORD_BOT_TOKEN')}`;
                break;
                
            case 'telegram':
                const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
                testEndpoint = `https://api.telegram.org/bot${telegramToken}/getMe`;
                break;
                
            case 'github':
                testEndpoint = 'https://api.github.com/user';
                testHeaders['Authorization'] = `token ${Deno.env.get('GITHUB_PERSONAL_ACCESS_TOKEN')}`;
                break;
                
            default:
                throw new Error(`Connection test not implemented for ${apiName}`);
        }
        
        const response = await fetch(testEndpoint, {
            headers: testHeaders
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            return {
                success: true,
                status: 'healthy',
                responseTime,
                message: `${apiName} API connection successful`
            };
        } else {
            return {
                success: false,
                status: 'error',
                responseTime,
                message: `${apiName} API connection failed: ${response.status}`
            };
        }
        
    } catch (error) {
        return {
            success: false,
            status: 'error',
            responseTime: Date.now() - startTime,
            error: error.message,
            message: `${apiName} API connection test failed`
        };
    }
}

// Get usage statistics
async function getUsageStats(supabaseUrl: string, serviceRoleKey: string, apiName: string, userId: string, corsHeaders: any) {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Query for usage statistics
    const statsQuery = `
        api_name=eq.${apiName}&
        user_id=eq.${userId}&
        created_at=gte.${last7Days.toISOString()}
    `;
    
    const response = await fetch(`${supabaseUrl}/rest/v1/api_usage_logs?${statsQuery}&select=*`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
    }

    const usageLogs = await response.json();
    
    // Calculate statistics
    const last24HoursLogs = usageLogs.filter((log: any) => new Date(log.created_at) >= last24Hours);
    const totalCost = usageLogs.reduce((sum: number, log: any) => sum + (log.cost_incurred || 0), 0);
    const avgResponseTime = usageLogs.length > 0 
        ? usageLogs.reduce((sum: number, log: any) => sum + (log.response_time_ms || 0), 0) / usageLogs.length 
        : 0;
    
    const stats = {
        totalRequests7Days: usageLogs.length,
        totalRequests24Hours: last24HoursLogs.length,
        totalCost7Days: totalCost,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: usageLogs.length > 0 
            ? (usageLogs.filter((log: any) => log.response_status >= 400).length / usageLogs.length) * 100 
            : 0
    };

    return new Response(JSON.stringify({ data: stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Health check all APIs
async function healthCheckAllAPIs(supabaseUrl: string, serviceRoleKey: string, corsHeaders: any) {
    const configResponse = await fetch(`${supabaseUrl}/rest/v1/api_configurations?status=eq.active&select=api_name,display_name`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!configResponse.ok) {
        throw new Error('Failed to fetch API configurations');
    }

    const apis = await configResponse.json();
    const healthResults = [];
    
    for (const api of apis) {
        const result = await performConnectionTest(api.api_name, {}, {});
        healthResults.push({
            apiName: api.api_name,
            displayName: api.display_name,
            ...result
        });
        
        // Log health check result
        await fetch(`${supabaseUrl}/rest/v1/api_health_checks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_name: api.api_name,
                status: result.success ? 'healthy' : 'down',
                response_time_ms: result.responseTime,
                error_message: result.error || null
            })
        });
    }

    return new Response(JSON.stringify({ data: healthResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

// Log API usage
async function logAPIUsage(supabaseUrl: string, serviceRoleKey: string, logData: any) {
    await fetch(`${supabaseUrl}/rest/v1/api_usage_logs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
    });
}