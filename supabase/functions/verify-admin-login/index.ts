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
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!anonKey || !supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Testing login for admin accounts...');

        // Define the admin accounts to test
        const adminAccounts = [
            {
                email: 'ara-m5dashboard@gmail.com',
                password: 'Aratest25'
            },
            {
                email: 'ara-m5info@gmail.com',
                password: 'Aratest25'
            },
            {
                email: 'ara-m5admin@gmail.com',
                password: 'Aratest25'
            }
        ];

        const loginResults = [];

        for (const account of adminAccounts) {
            try {
                console.log(`Testing login for ${account.email}...`);

                // Attempt to sign in with the credentials
                const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': anonKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: account.email,
                        password: account.password
                    })
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    console.log(`Login successful for ${account.email}`);
                    
                    // Get user details and admin permissions
                    const userId = loginData.user.id;
                    
                    // Check admin permissions
                    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${userId}&select=*`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    let adminData = null;
                    if (adminResponse.ok) {
                        const adminResults = await adminResponse.json();
                        adminData = adminResults[0] || null;
                    }

                    loginResults.push({
                        email: account.email,
                        status: 'success',
                        message: 'Login successful',
                        user_id: userId,
                        admin_level: adminData?.admin_level || 'none',
                        permissions: adminData?.permissions || {},
                        access_token_length: loginData.access_token ? loginData.access_token.length : 0
                    });
                } else {
                    const errorData = await loginResponse.text();
                    console.error(`Login failed for ${account.email}:`, errorData);
                    
                    loginResults.push({
                        email: account.email,
                        status: 'failed',
                        message: 'Login failed',
                        error: errorData
                    });
                }

            } catch (accountError) {
                console.error(`Error testing login for ${account.email}:`, accountError.message);
                
                loginResults.push({
                    email: account.email,
                    status: 'error',
                    message: 'Login test error',
                    error: accountError.message
                });
            }
        }

        const successfulLogins = loginResults.filter(r => r.status === 'success').length;
        const failedLogins = loginResults.filter(r => r.status !== 'success').length;

        const result = {
            data: {
                message: 'Admin account login verification completed',
                login_results: loginResults,
                summary: {
                    total_tested: adminAccounts.length,
                    successful_logins: successfulLogins,
                    failed_logins: failedLogins,
                    all_accounts_working: failedLogins === 0
                }
            }
        };

        console.log('Login verification completed:', result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login verification error:', error);

        const errorResponse = {
            error: {
                code: 'LOGIN_VERIFICATION_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});