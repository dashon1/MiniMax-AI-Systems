// OpenAI API Integration - GPT, DALL-E, Whisper services

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
        const { service, ...params } = await req.json();
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
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

        switch (service) {
            case 'chat_completion':
                result = await handleChatCompletion(openaiApiKey, params);
                break;
            
            case 'image_generation':
                result = await handleImageGeneration(openaiApiKey, params);
                break;
            
            case 'audio_transcription':
                result = await handleAudioTranscription(openaiApiKey, params);
                break;
            
            case 'audio_generation':
                result = await handleAudioGeneration(openaiApiKey, params);
                break;
            
            default:
                throw new Error(`Unsupported OpenAI service: ${service}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'openai',
                user_id: userId,
                endpoint: service,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                tokens_used: result.usage?.total_tokens || 0,
                cost_incurred: calculateCost(service, result.usage)
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('OpenAI integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'OPENAI_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Handle chat completion requests
async function handleChatCompletion(apiKey: string, params: any) {
    const {
        model = 'gpt-4o-mini',
        messages,
        max_tokens = 1000,
        temperature = 0.7,
        ...otherParams
    } = params;

    if (!messages || !Array.isArray(messages)) {
        throw new Error('Messages array is required for chat completion');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens,
            temperature,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Handle image generation requests
async function handleImageGeneration(apiKey: string, params: any) {
    const {
        prompt,
        model = 'dall-e-3',
        size = '1024x1024',
        quality = 'standard',
        n = 1,
        ...otherParams
    } = params;

    if (!prompt) {
        throw new Error('Prompt is required for image generation');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            prompt,
            size,
            quality,
            n,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Handle audio transcription requests
async function handleAudioTranscription(apiKey: string, params: any) {
    const {
        audio_data,
        model = 'whisper-1',
        language,
        ...otherParams
    } = params;

    if (!audio_data) {
        throw new Error('Audio data is required for transcription');
    }

    // Convert base64 audio to blob
    const audioBlob = new Uint8Array(atob(audio_data).split('').map(c => c.charCodeAt(0)));
    
    const formData = new FormData();
    formData.append('file', new Blob([audioBlob]), 'audio.wav');
    formData.append('model', model);
    if (language) formData.append('language', language);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Handle audio generation requests (TTS)
async function handleAudioGeneration(apiKey: string, params: any) {
    const {
        input,
        model = 'tts-1',
        voice = 'alloy',
        ...otherParams
    } = params;

    if (!input) {
        throw new Error('Input text is required for audio generation');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            input,
            voice,
            ...otherParams
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    // Return audio as base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    return {
        audio_data: base64Audio,
        content_type: 'audio/mp3'
    };
}

// Calculate cost based on usage
function calculateCost(service: string, usage: any): number {
    if (!usage) return 0;
    
    const costs = {
        'chat_completion': {
            'gpt-4o': { input: 0.0025, output: 0.01 },
            'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
            'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
        },
        'image_generation': {
            'dall-e-3': { '1024x1024': 0.04, '1024x1792': 0.08, '1792x1024': 0.08 },
            'dall-e-2': { '1024x1024': 0.02, '512x512': 0.018, '256x256': 0.016 }
        },
        'audio_transcription': {
            'whisper-1': 0.006 // per minute
        },
        'audio_generation': {
            'tts-1': 0.015, // per 1K characters
            'tts-1-hd': 0.03
        }
    };
    
    // Simplified cost calculation - would need more detailed implementation
    return usage.total_tokens ? usage.total_tokens * 0.00002 : 0.01;
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