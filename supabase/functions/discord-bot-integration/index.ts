// Discord Bot Integration - Bot management and messaging

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
        const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!botToken) {
            throw new Error('Discord bot token not configured');
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
            
            case 'create_channel':
                result = await createChannel(botToken, params);
                break;
            
            case 'get_guild_info':
                result = await getGuildInfo(botToken, params);
                break;
            
            case 'get_bot_info':
                result = await getBotInfo(botToken);
                break;
            
            case 'send_embed':
                result = await sendEmbed(botToken, params);
                break;
            
            default:
                throw new Error(`Unsupported Discord action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'discord',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0001 // Minimal cost for Discord API
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Discord integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'DISCORD_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Send message to Discord channel
async function sendMessage(botToken: string, params: any) {
    const { channelId, content, ...otherParams } = params;

    if (!channelId || !content) {
        throw new Error('Channel ID and content are required');
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Discord API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Send embed message to Discord channel
async function sendEmbed(botToken: string, params: any) {
    const { channelId, embed, content = '', ...otherParams } = params;

    if (!channelId || !embed) {
        throw new Error('Channel ID and embed are required');
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content,
            embeds: [embed],
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Discord API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create Discord channel
async function createChannel(botToken: string, params: any) {
    const { guildId, name, type = 0, ...otherParams } = params;

    if (!guildId || !name) {
        throw new Error('Guild ID and channel name are required');
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            type,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Discord API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get guild information
async function getGuildInfo(botToken: string, params: any) {
    const { guildId } = params;

    if (!guildId) {
        throw new Error('Guild ID is required');
    }

    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: {
            'Authorization': `Bot ${botToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Discord API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get bot information
async function getBotInfo(botToken: string) {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
            'Authorization': `Bot ${botToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Discord API error: ${response.status} - ${errorData}`);
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