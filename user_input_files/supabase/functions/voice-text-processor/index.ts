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
        const { action, text, audioData, language = 'en-US', voiceSettings = {} } = await req.json();
        
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        let result = {};

        if (action === 'text-to-speech') {
            // Text-to-Speech using Web Speech API simulation
            // Since we can't actually use browser APIs in edge functions,
            // we'll return structured data for client-side processing
            result = {
                type: 'text-to-speech',
                text: text,
                language: language,
                voiceSettings: {
                    rate: voiceSettings.rate || 1.0,
                    pitch: voiceSettings.pitch || 1.0,
                    volume: voiceSettings.volume || 1.0,
                    voice: voiceSettings.voice || 'auto'
                },
                instructions: {
                    method: 'web_speech_api',
                    ssml: `<speak><prosody rate="${voiceSettings.rate || 1.0}" pitch="${voiceSettings.pitch || 1.0}">${text}</prosody></speak>`
                }
            };
        } else if (action === 'speech-to-text') {
            // For speech-to-text, we'll process audio data
            // In a real implementation, you would use a service like Google Cloud Speech
            // For now, we'll return instructions for client-side processing
            result = {
                type: 'speech-to-text',
                audioData: audioData,
                language: language,
                instructions: {
                    method: 'web_speech_api',
                    settings: {
                        continuous: true,
                        interimResults: true,
                        language: language
                    }
                }
            };
        } else if (action === 'save-voice-settings') {
            // Save or update user voice settings
            const settingsData = {
                tenant_id: userData.app_metadata?.tenant_id || null,
                user_id: userId,
                preferred_voice: voiceSettings.voice || 'auto',
                speech_rate: voiceSettings.rate || 1.0,
                speech_pitch: voiceSettings.pitch || 1.0,
                language_code: language,
                auto_transcription: voiceSettings.autoTranscription !== false,
                voice_commands_enabled: voiceSettings.voiceCommands !== false,
                noise_cancellation: voiceSettings.noiseCancellation !== false,
                settings_data: voiceSettings,
                updated_at: new Date().toISOString()
            };

            // Upsert voice settings
            const upsertResponse = await fetch(`${supabaseUrl}/rest/v1/voice_settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=representation'
                },
                body: JSON.stringify(settingsData)
            });

            if (!upsertResponse.ok) {
                const errorText = await upsertResponse.text();
                throw new Error(`Failed to save voice settings: ${errorText}`);
            }

            const savedSettings = await upsertResponse.json();
            result = {
                type: 'settings-saved',
                settings: savedSettings[0] || savedSettings
            };
        } else if (action === 'get-voice-settings') {
            // Get user voice settings
            const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/voice_settings?user_id=eq.${userId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!settingsResponse.ok) {
                throw new Error('Failed to fetch voice settings');
            }

            const settings = await settingsResponse.json();
            result = {
                type: 'settings-retrieved',
                settings: settings[0] || {
                    preferred_voice: 'auto',
                    speech_rate: 1.0,
                    speech_pitch: 1.0,
                    language_code: 'en-US',
                    auto_transcription: true,
                    voice_commands_enabled: true,
                    noise_cancellation: true
                }
            };
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Voice processing error:', error);

        const errorResponse = {
            error: {
                code: 'VOICE_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});