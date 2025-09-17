// Telegram Bot Integration - Messaging and bot management

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
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!botToken) {
            throw new Error('Telegram bot token not configured');
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
            case 'send_message':
                result = await sendMessage(botToken, params);
                break;
            
            case 'send_photo':
                result = await sendPhoto(botToken, params);
                break;
            
            case 'get_bot_info':
                result = await getBotInfo(botToken);
                break;
            
            case 'set_webhook':
                result = await setWebhook(botToken, params);
                break;
            
            case 'get_updates':
                result = await getUpdates(botToken, params);
                break;
            
            default:
                throw new Error(`Unsupported Telegram action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'telegram',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0001 // Minimal cost for Telegram API
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Telegram integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'TELEGRAM_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Send message via Telegram
async function sendMessage(botToken: string, params: any) {
    const { chat_id, text, parse_mode = 'HTML', ...otherParams } = params;

    if (!chat_id || !text) {
        throw new Error('Chat ID and text are required');
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id,
            text,
            parse_mode,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Send photo via Telegram
async function sendPhoto(botToken: string, params: any) {
    const { chat_id, photo, caption = '', ...otherParams } = params;

    if (!chat_id || !photo) {
        throw new Error('Chat ID and photo are required');
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id,
            photo,
            caption,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get bot information
async function getBotInfo(botToken: string) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Set webhook for bot
async function setWebhook(botToken: string, params: any) {
    const { url, ...otherParams } = params;

    if (!url) {
        throw new Error('Webhook URL is required');
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get updates from Telegram
async function getUpdates(botToken: string, params: any) {
    const { offset, limit = 100, timeout = 0, ...otherParams } = params;

    const queryParams = new URLSearchParams({
        limit: limit.toString(),
        timeout: timeout.toString(),
        ...otherParams
    });

    if (offset) {
        queryParams.append('offset', offset.toString());
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?${queryParams}`);

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${errorData}`);
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