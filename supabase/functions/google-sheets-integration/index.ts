// Google Sheets API Integration - Spreadsheet data management

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
        const googleCredentials = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!googleCredentials) {
            throw new Error('Google Sheets credentials not configured');
        }

        // Parse credentials
        const credentials = JSON.parse(googleCredentials);
        
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

        // Get access token first
        const accessToken = await getAccessToken(credentials);

        switch (action) {
            case 'get_spreadsheet':
                result = await getSpreadsheet(accessToken, params);
                break;
            
            case 'get_values':
                result = await getValues(accessToken, params);
                break;
            
            case 'update_values':
                result = await updateValues(accessToken, params);
                break;
            
            case 'append_values':
                result = await appendValues(accessToken, params);
                break;
            
            case 'create_spreadsheet':
                result = await createSpreadsheet(accessToken, params);
                break;
            
            case 'batch_update':
                result = await batchUpdate(accessToken, params);
                break;
            
            default:
                throw new Error(`Unsupported Google Sheets action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'google_sheets',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0002 // Minimal cost for Google Sheets API
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Google Sheets integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'GOOGLE_SHEETS_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Get access token using service account credentials
async function getAccessToken(credentials: any) {
    const jwt = await createJWT(credentials);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OAuth error: ${response.status} - ${errorData}`);
    }

    const tokenData = await response.json();
    return tokenData.access_token;
}

// Create JWT for service account authentication
async function createJWT(credentials: any) {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    };

    // Simple JWT creation (in production, use a proper JWT library)
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    // Import private key
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        new TextEncoder().encode(credentials.private_key),
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256'
        },
        false,
        ['sign']
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    return `${signatureInput}.${encodedSignature}`;
}

// Get spreadsheet metadata
async function getSpreadsheet(accessToken: string, params: any) {
    const { spreadsheetId } = params;

    if (!spreadsheetId) {
        throw new Error('Spreadsheet ID is required');
    }

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get values from spreadsheet
async function getValues(accessToken: string, params: any) {
    const { spreadsheetId, range, majorDimension = 'ROWS', valueRenderOption = 'FORMATTED_VALUE' } = params;

    if (!spreadsheetId || !range) {
        throw new Error('Spreadsheet ID and range are required');
    }

    const queryParams = new URLSearchParams({
        majorDimension,
        valueRenderOption
    });

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Update values in spreadsheet
async function updateValues(accessToken: string, params: any) {
    const { spreadsheetId, range, values, valueInputOption = 'USER_ENTERED' } = params;

    if (!spreadsheetId || !range || !values) {
        throw new Error('Spreadsheet ID, range, and values are required');
    }

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=${valueInputOption}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Append values to spreadsheet
async function appendValues(accessToken: string, params: any) {
    const { spreadsheetId, range, values, valueInputOption = 'USER_ENTERED', insertDataOption = 'INSERT_ROWS' } = params;

    if (!spreadsheetId || !range || !values) {
        throw new Error('Spreadsheet ID, range, and values are required');
    }

    const queryParams = new URLSearchParams({
        valueInputOption,
        insertDataOption
    });

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?${queryParams}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create new spreadsheet
async function createSpreadsheet(accessToken: string, params: any) {
    const { title, sheets = [] } = params;

    if (!title) {
        throw new Error('Spreadsheet title is required');
    }

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            properties: {
                title
            },
            sheets
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Batch update spreadsheet
async function batchUpdate(accessToken: string, params: any) {
    const { spreadsheetId, requests } = params;

    if (!spreadsheetId || !requests) {
        throw new Error('Spreadsheet ID and requests are required');
    }

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData}`);
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