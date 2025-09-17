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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!anonKey || !serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Running comprehensive login test for all ara-m5 accounts...');

        const adminAccounts = [
            { email: 'ara-m5dashboard@gmail.com', password: 'Aratest25' },
            { email: 'ara-m5info@gmail.com', password: 'Aratest25' },
            { email: 'ara-m5admin@gmail.com', password: 'Aratest25' }
        ];

        const testResults = [];

        for (const account of adminAccounts) {
            console.log(`Testing account: ${account.email}`);
            
            const accountResult = {
                email: account.email,
                auth_login: null,
                admin_check: null,
                profile_check: null,
                overall_status: 'pending'
            };

            try {
                // Test 1: Authentication login
                console.log(`Testing auth login for ${account.email}...`);
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
                    accountResult.auth_login = {
                        status: 'success',
                        user_id: loginData.user.id,
                        access_token_length: loginData.access_token.length
                    };
                    console.log(`Auth login successful for ${account.email}`);

                    // Test 2: Admin permissions check
                    console.log(`Checking admin permissions for ${account.email}...`);
                    const adminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${loginData.user.id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (adminResponse.ok) {
                        const adminData = await adminResponse.json();
                        if (adminData.length > 0) {
                            accountResult.admin_check = {
                                status: 'success',
                                admin_level: adminData[0].admin_level,
                                permissions: Object.keys(adminData[0].permissions || {}).length
                            };
                            console.log(`Admin check successful for ${account.email}`);
                        } else {
                            accountResult.admin_check = {
                                status: 'failed',
                                error: 'No admin record found'
                            };
                        }
                    } else {
                        accountResult.admin_check = {
                            status: 'failed',
                            error: 'Admin query failed'
                        };
                    }

                    // Test 3: User profile check
                    console.log(`Checking user profile for ${account.email}...`);
                    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${loginData.user.id}`, {
                        headers: {
                            'Authorization': `Bearer ${serviceRoleKey}`,
                            'apikey': serviceRoleKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        if (profileData.length > 0) {
                            accountResult.profile_check = {
                                status: 'success',
                                full_name: profileData[0].full_name,
                                plan_type: profileData[0].plan_type
                            };
                            console.log(`Profile check successful for ${account.email}`);
                        } else {
                            accountResult.profile_check = {
                                status: 'failed',
                                error: 'No profile found'
                            };
                        }
                    } else {
                        accountResult.profile_check = {
                            status: 'failed',
                            error: 'Profile query failed'
                        };
                    }

                } else {
                    const errorData = await loginResponse.text();
                    accountResult.auth_login = {
                        status: 'failed',
                        error: errorData
                    };
                    console.error(`Auth login failed for ${account.email}: ${errorData}`);
                }

                // Determine overall status
                if (accountResult.auth_login?.status === 'success' && 
                    accountResult.admin_check?.status === 'success' && 
                    accountResult.profile_check?.status === 'success') {
                    accountResult.overall_status = 'complete';
                } else if (accountResult.auth_login?.status === 'success') {
                    accountResult.overall_status = 'partial';
                } else {
                    accountResult.overall_status = 'failed';
                }

            } catch (error: any) {
                console.error(`Error testing ${account.email}:`, error.message);
                accountResult.overall_status = 'error';
                accountResult.auth_login = {
                    status: 'error',
                    error: error.message
                };
            }

            testResults.push(accountResult);
        }

        // Generate summary
        const summary = {
            total_accounts: adminAccounts.length,
            complete_accounts: testResults.filter(r => r.overall_status === 'complete').length,
            partial_accounts: testResults.filter(r => r.overall_status === 'partial').length,
            failed_accounts: testResults.filter(r => r.overall_status === 'failed').length,
            error_accounts: testResults.filter(r => r.overall_status === 'error').length,
            all_working: testResults.every(r => r.overall_status === 'complete')
        };

        const result = {
            data: {
                message: 'Comprehensive login test completed',
                timestamp: new Date().toISOString(),
                test_results: testResults,
                summary: summary,
                recommendations: summary.all_working ? 
                    ['All admin accounts are working perfectly'] : 
                    ['Some accounts need attention - check failed tests']
            }
        };

        console.log('Comprehensive test completed:', result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Comprehensive test error:', error);

        const errorResponse = {
            error: {
                code: 'COMPREHENSIVE_TEST_FAILED',
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