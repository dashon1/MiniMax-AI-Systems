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
        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        
        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing Supabase configuration');
        }

        const { action, userId, userData, adminUserId } = await req.json();

        // Verify admin permissions
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${adminUserId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });
        
        const adminData = await adminCheckResponse.json();
        if (!adminData || adminData.length === 0) {
            throw new Error('Unauthorized: Admin access required');
        }

        let result;
        switch (action) {
            case 'list':
                // Get all users with stats
                const usersResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                result = await usersResponse.json();
                break;

            case 'create':
                // Create new user
                const createResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: crypto.randomUUID(),
                        email: userData.email,
                        full_name: userData.full_name,
                        plan_type: userData.plan_type || 'basic',
                        monthly_limit: userData.monthly_limit || 100,
                        subscription_tier: userData.subscription_tier || 'basic',
                        subscription_status: 'active',
                        created_at: new Date().toISOString()
                    })
                });
                result = await createResponse.json();
                break;

            case 'update':
                // Update user
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...userData,
                        updated_at: new Date().toISOString()
                    })
                });
                result = await updateResponse.json();
                break;

            case 'delete':
                // Soft delete user
                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription_status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                });
                result = await deleteResponse.json();
                break;

            case 'stats':
                // Get user statistics
                const statsResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?select=subscription_tier,subscription_status&subscription_status=eq.active`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                const users = await statsResponse.json();
                
                // Count by tier
                const stats = users.reduce((acc, user) => {
                    const tier = user.subscription_tier || 'basic';
                    acc[tier] = (acc[tier] || 0) + 1;
                    return acc;
                }, {});
                
                result = {
                    totalUsers: users.length,
                    byTier: stats,
                    activeUsers: users.length
                };
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin user management error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'ADMIN_USER_MANAGEMENT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
