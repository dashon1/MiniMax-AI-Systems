// Anthropic Claude API Integration - Advanced LLM services

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
        const { action, ...params } = await req.json();
        const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!anthropicApiKey) {
            throw new Error('Anthropic API key not configured');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        let userId = null;
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

        const startTime = Date.now();
        let result;

        switch (action) {
            case 'messages':
                result = await createMessage(anthropicApiKey, params);
                break;
            
            case 'text_completion':
                result = await textCompletion(anthropicApiKey, params);
                break;
            
            default:
                throw new Error(`Unsupported Anthropic action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'anthropic',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                tokens_used: result.usage?.input_tokens + result.usage?.output_tokens || 0,
                cost_incurred: calculateCost(result.usage)
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Anthropic integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'ANTHROPIC_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Create message with Claude
async function createMessage(anthropicApiKey: string, params: any) {
    const {
        model = 'claude-3-sonnet-20240229',
        max_tokens = 1000,
        messages,
        system,
        temperature = 0.7,
        ...otherParams
    } = params;

    if (!messages || !Array.isArray(messages)) {
        throw new Error('Messages array is required');
    }

    const requestBody = {
        model,
        max_tokens,
        messages,
        temperature,
        ...otherParams
    };

    if (system) {
        requestBody.system = system;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': anthropicApiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Text completion (legacy format for compatibility)
async function textCompletion(anthropicApiKey: string, params: any) {
    const { prompt, ...otherParams } = params;

    if (!prompt) {
        throw new Error('Prompt is required for text completion');
    }

    // Convert to messages format
    const messages = [{ role: 'user', content: prompt }];
    
    return await createMessage(anthropicApiKey, { messages, ...otherParams });
}

// Calculate cost based on usage
function calculateCost(usage: any): number {
    if (!usage) return 0;
    
    // Claude-3 pricing (approximate)
    const inputCostPer1K = 0.003;
    const outputCostPer1K = 0.015;
    
    const inputCost = (usage.input_tokens || 0) / 1000 * inputCostPer1K;
    const outputCost = (usage.output_tokens || 0) / 1000 * outputCostPer1K;
    
    return inputCost + outputCost;
}

// Log API usage
async function logUsage(supabaseUrl: string, serviceRoleKey: string, logData: any) {
    try {
        await fetch(`${supabaseUrl}/rest/v1/api_usage_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });
    } catch (error) {
        console.error('Failed to log usage:', error);
    }
}