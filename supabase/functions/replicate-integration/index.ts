// Replicate API Integration - AI model hosting and execution

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
        const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!replicateToken) {
            throw new Error('Replicate API token not configured');
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
            case 'create_prediction':
                result = await createPrediction(replicateToken, params);
                break;
            
            case 'get_prediction':
                result = await getPrediction(replicateToken, params);
                break;
            
            case 'list_models':
                result = await listModels(replicateToken, params);
                break;
            
            case 'get_model':
                result = await getModel(replicateToken, params);
                break;
            
            default:
                throw new Error(`Unsupported Replicate action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'replicate',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.005 // Variable cost for Replicate
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Replicate integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'REPLICATE_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Create a prediction
async function createPrediction(token: string, params: any) {
    const { version, input, webhook, webhook_events_filter } = params;

    if (!version || !input) {
        throw new Error('Version and input are required for creating a prediction');
    }

    const requestBody = {
        version,
        input
    };

    if (webhook) {
        requestBody.webhook = webhook;
    }

    if (webhook_events_filter) {
        requestBody.webhook_events_filter = webhook_events_filter;
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get a prediction
async function getPrediction(token: string, params: any) {
    const { predictionId } = params;

    if (!predictionId) {
        throw new Error('Prediction ID is required');
    }

    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
            'Authorization': `Token ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// List models
async function listModels(token: string, params: any) {
    const { cursor, limit = 20 } = params;

    const queryParams = new URLSearchParams({
        limit: limit.toString()
    });

    if (cursor) {
        queryParams.append('cursor', cursor);
    }

    const response = await fetch(`https://api.replicate.com/v1/models?${queryParams}`, {
        headers: {
            'Authorization': `Token ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get a specific model
async function getModel(token: string, params: any) {
    const { owner, name } = params;

    if (!owner || !name) {
        throw new Error('Owner and model name are required');
    }

    const response = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
        headers: {
            'Authorization': `Token ${token}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Replicate API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
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