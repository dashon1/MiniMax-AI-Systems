// Airtable API Integration - Database management and data sync

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
        const airtableApiKey = Deno.env.get('AIRTABLE_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!airtableApiKey) {
            throw new Error('Airtable API key not configured');
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
            case 'list_records':
                result = await listRecords(airtableApiKey, params);
                break;
            
            case 'create_records':
                result = await createRecords(airtableApiKey, params);
                break;
            
            case 'update_records':
                result = await updateRecords(airtableApiKey, params);
                break;
            
            case 'delete_records':
                result = await deleteRecords(airtableApiKey, params);
                break;
            
            case 'get_base_schema':
                result = await getBaseSchema(airtableApiKey, params);
                break;
            
            default:
                throw new Error(`Unsupported Airtable action: ${action}`);
        }

        const responseTime = Date.now() - startTime;

        // Log usage
        if (supabaseUrl && serviceRoleKey) {
            await logUsage(supabaseUrl, serviceRoleKey, {
                api_name: 'airtable',
                user_id: userId,
                endpoint: action,
                method: 'POST',
                response_status: 200,
                response_time_ms: responseTime,
                cost_incurred: 0.0003 // Cost per request for Airtable
            });
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Airtable integration error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'AIRTABLE_INTEGRATION_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// List records from Airtable table
async function listRecords(airtableApiKey: string, params: any) {
    const { baseId, tableId, maxRecords = 100, pageSize = 100, filterByFormula, sort, ...otherParams } = params;

    if (!baseId || !tableId) {
        throw new Error('Base ID and Table ID are required');
    }

    const queryParams = new URLSearchParams({
        maxRecords: maxRecords.toString(),
        pageSize: pageSize.toString()
    });

    if (filterByFormula) {
        queryParams.append('filterByFormula', filterByFormula);
    }

    if (sort) {
        queryParams.append('sort', JSON.stringify(sort));
    }

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?${queryParams}`, {
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Create records in Airtable table
async function createRecords(airtableApiKey: string, params: any) {
    const { baseId, tableId, records, typecast = false } = params;

    if (!baseId || !tableId || !records || !Array.isArray(records)) {
        throw new Error('Base ID, Table ID, and records array are required');
    }

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            records,
            typecast
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Update records in Airtable table
async function updateRecords(airtableApiKey: string, params: any) {
    const { baseId, tableId, records, typecast = false } = params;

    if (!baseId || !tableId || !records || !Array.isArray(records)) {
        throw new Error('Base ID, Table ID, and records array are required');
    }

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            records,
            typecast
        })
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Delete records from Airtable table
async function deleteRecords(airtableApiKey: string, params: any) {
    const { baseId, tableId, recordIds } = params;

    if (!baseId || !tableId || !recordIds || !Array.isArray(recordIds)) {
        throw new Error('Base ID, Table ID, and record IDs array are required');
    }

    const queryParams = recordIds.map(id => `records[]=${id}`).join('&');

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?${queryParams}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
    }

    return await response.json();
}

// Get base schema information
async function getBaseSchema(airtableApiKey: string, params: any) {
    const { baseId } = params;

    if (!baseId) {
        throw new Error('Base ID is required');
    }

    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
        headers: {
            'Authorization': `Bearer ${airtableApiKey}`
        }
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorData}`);
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