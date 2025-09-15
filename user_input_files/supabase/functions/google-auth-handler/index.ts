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
        const { action, code, redirectUri, scopes, refreshToken, service } = await req.json();
        
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
        const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        if (!googleClientId || !googleClientSecret) {
            throw new Error('Google OAuth credentials not configured');
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
        const tenantId = userData.app_metadata?.tenant_id;

        if (!tenantId) {
            throw new Error('No tenant ID found for user');
        }

        console.log(`Google auth action: ${action}, service: ${service}, user: ${userId}`);

        if (action === 'get_auth_url') {
            // Generate OAuth URL for Google services
            const baseScopes = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'];
            const calendarScopes = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
            const gmailScopes = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'];
            
            let requestedScopes = [...baseScopes];
            
            if (service === 'calendar' || service === 'both') {
                requestedScopes = [...requestedScopes, ...calendarScopes];
            }
            if (service === 'gmail' || service === 'both') {
                requestedScopes = [...requestedScopes, ...gmailScopes];
            }

            const params = new URLSearchParams({
                client_id: googleClientId,
                redirect_uri: redirectUri || 'https://g8pkohw14gju.space.minimax.io/auth/callback',
                response_type: 'code',
                scope: requestedScopes.join(' '),
                access_type: 'offline',
                prompt: 'consent',
                state: JSON.stringify({ userId, tenantId, service: service || 'both' })
            });

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

            return new Response(JSON.stringify({
                data: {
                    authUrl,
                    scopes: requestedScopes
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'exchange_code') {
            // Exchange authorization code for access token
            if (!code) {
                throw new Error('Authorization code is required');
            }

            const tokenParams = new URLSearchParams({
                client_id: googleClientId,
                client_secret: googleClientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri || 'https://g8pkohw14gju.space.minimax.io/auth/callback'
            });

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: tokenParams.toString()
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                throw new Error(`Google token exchange failed: ${errorData}`);
            }

            const tokenData = await tokenResponse.json();
            
            // Get user info from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            });

            if (!userInfoResponse.ok) {
                throw new Error('Failed to get user info from Google');
            }

            const userInfo = await userInfoResponse.json();
            
            // Calculate token expiration
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

            // Check what services are included in the scopes
            const hasCalendarScope = tokenData.scope?.includes('calendar');
            const hasGmailScope = tokenData.scope?.includes('gmail');

            // Store or update the token in the database
            const tokenRecord = {
                user_id: userId,
                tenant_id: tenantId,
                google_user_id: userInfo.id,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                token_expires_at: expiresAt.toISOString(),
                scope: tokenData.scope,
                calendar_enabled: hasCalendarScope,
                gmail_enabled: hasGmailScope,
                user_email: userInfo.email,
                user_name: userInfo.name,
                updated_at: new Date().toISOString()
            };

            // Check if token already exists
            const existingTokenResponse = await fetch(
                `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const existingTokens = await existingTokenResponse.json();
            
            if (existingTokens && existingTokens.length > 0) {
                // Update existing token
                const updateResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(tokenRecord)
                    }
                );

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to update Google auth token: ${errorText}`);
                }
            } else {
                // Create new token record
                const insertResponse = await fetch(
                    `${supabaseUrl}/rest/v1/google_auth_tokens`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(tokenRecord)
                    }
                );

                if (!insertResponse.ok) {
                    const errorText = await insertResponse.text();
                    throw new Error(`Failed to store Google auth token: ${errorText}`);
                }
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    services: {
                        calendar: hasCalendarScope,
                        gmail: hasGmailScope
                    },
                    user: {
                        email: userInfo.email,
                        name: userInfo.name
                    },
                    expires_at: expiresAt.toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'refresh_token') {
            // Refresh access token using refresh token
            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }

            const refreshParams = new URLSearchParams({
                client_id: googleClientId,
                client_secret: googleClientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            });

            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: refreshParams.toString()
            });

            if (!refreshResponse.ok) {
                const errorData = await refreshResponse.text();
                throw new Error(`Token refresh failed: ${errorData}`);
            }

            const refreshData = await refreshResponse.json();
            
            // Update token in database
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in);

            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        access_token: refreshData.access_token,
                        token_expires_at: expiresAt.toISOString(),
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update refreshed token: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    access_token: refreshData.access_token,
                    expires_at: expiresAt.toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_status') {
            // Get current OAuth status for user
            const tokenResponse = await fetch(
                `${supabaseUrl}/rest/v1/google_auth_tokens?user_id=eq.${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const tokens = await tokenResponse.json();
            
            if (!tokens || tokens.length === 0) {
                return new Response(JSON.stringify({
                    data: {
                        connected: false,
                        services: {
                            calendar: false,
                            gmail: false
                        }
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const token = tokens[0];
            const isExpired = new Date(token.token_expires_at) <= new Date();

            return new Response(JSON.stringify({
                data: {
                    connected: !isExpired,
                    expires_at: token.token_expires_at,
                    services: {
                        calendar: token.calendar_enabled,
                        gmail: token.gmail_enabled
                    },
                    user: {
                        email: token.user_email,
                        name: token.user_name
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Google auth handler error:', error);

        const errorResponse = {
            error: {
                code: 'GOOGLE_AUTH_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});