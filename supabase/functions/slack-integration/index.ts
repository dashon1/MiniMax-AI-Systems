// Slack API Integration - Workspace automation and messaging

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
        const slackToken = Deno.env.get('SLACK_BOT_TOKEN');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!slackToken) {
            throw new Error('Slack bot token not configured');
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
                result = await sendMessage(slackToken, params);
                break;
            
            case 'post_message':
                result = await postMessage(slackToken, params);
                break;
            
            case 'upload_file':
                result = await uploadFile(slackToken, params);
                break;
            
            case 'create_channel':
                result = await createChannel(slackToken, params);
                break;
            
            case 'list_channels':
                result = await listChannels(slackToken, params);
                break;
            
            case 'get_user_info':
                result = await getUserInfo(slackToken, params);
                break;
            
            default:
                throw new Error(`Unsupported Slack action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'slack',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0002 // Minimal cost for Slack API
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Slack integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'SLACK_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Send message to Slack
async function sendMessage(slackToken: string, params: any) {
    const { channel, text, ...otherParams } = params;

    if (!channel || !text) {
        throw new Error('Channel and text are required');
    }

    const formData = new FormData();
    formData.append('channel', channel);
    formData.append('text', text);
    
    Object.keys(otherParams).forEach(key => {
        formData.append(key, otherParams[key]);
    });

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${slackToken}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Post message with rich formatting
async function postMessage(slackToken: string, params: any) {
    const { channel, text, blocks, attachments, ...otherParams } = params;

    if (!channel || (!text && !blocks)) {
        throw new Error('Channel and either text or blocks are required');
    }

    const requestBody = {
        channel,
        ...otherParams
    };

    if (text) requestBody.text = text;
    if (blocks) requestBody.blocks = blocks;
    if (attachments) requestBody.attachments = attachments;

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${slackToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Upload file to Slack
async function uploadFile(slackToken: string, params: any) {
    const { channels, file_data, filename, title, initial_comment } = params;

    if (!channels || !file_data || !filename) {
        throw new Error('Channels, file data, and filename are required');
    }

    // Convert base64 to blob
    const fileBlob = new Uint8Array(atob(file_data).split('').map(c => c.charCodeAt(0)));
    
    const formData = new FormData();
    formData.append('channels', channels);
    formData.append('file', new Blob([fileBlob]), filename);
    if (title) formData.append('title', title);
    if (initial_comment) formData.append('initial_comment', initial_comment);

    const response = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${slackToken}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create a new channel
async function createChannel(slackToken: string, params: any) {
    const { name, is_private = false } = params;

    if (!name) {
        throw new Error('Channel name is required');
    }

    const response = await fetch('https://slack.com/api/conversations.create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${slackToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            is_private
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// List channels
async function listChannels(slackToken: string, params: any) {
    const { exclude_archived = true, types = 'public_channel,private_channel', limit = 100 } = params;

    const queryParams = new URLSearchParams({
        exclude_archived: exclude_archived.toString(),
        types,
        limit: limit.toString()
    });

    const response = await fetch(`https://slack.com/api/conversations.list?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${slackToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get user information
async function getUserInfo(slackToken: string, params: any) {
    const { user } = params;

    if (!user) {
        throw new Error('User ID is required');
    }

    const response = await fetch(`https://slack.com/api/users.info?user=${user}`, {
        headers: {
            'Authorization': `Bearer ${slackToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${errorData}`);
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