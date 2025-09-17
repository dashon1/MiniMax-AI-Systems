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
        const { email, password } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !anonKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log(`Running auth diagnostics for ${email}...`);

        const diagnostics = {
            user_exists_in_auth: false,
            user_details: null,
            user_profile_exists: false,
            admin_record_exists: false,
            admin_permissions: null,
            password_login_test: null,
            potential_issues: [],
            recommendations: []
        };

        // 1. Check if user exists in auth.users
        console.log('Checking auth.users table...');
        const authCheckResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (authCheckResponse.ok) {
            const authData = await authCheckResponse.json();
            if (authData.users && authData.users.length > 0) {
                diagnostics.user_exists_in_auth = true;
                diagnostics.user_details = {
                    id: authData.users[0].id,
                    email: authData.users[0].email,
                    email_confirmed_at: authData.users[0].email_confirmed_at,
                    created_at: authData.users[0].created_at,
                    last_sign_in_at: authData.users[0].last_sign_in_at,
                    user_metadata: authData.users[0].user_metadata
                };
                console.log(`User found in auth: ${authData.users[0].id}`);
            } else {
                diagnostics.potential_issues.push('User does not exist in auth.users table');
                diagnostics.recommendations.push('User needs to be created in Supabase Auth');
            }
        } else {
            diagnostics.potential_issues.push('Failed to check auth.users table');
        }

        // 2. If user exists, check user_profiles table
        if (diagnostics.user_exists_in_auth && diagnostics.user_details) {
            console.log('Checking user_profiles table...');
            const profileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${diagnostics.user_details.id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.length > 0) {
                    diagnostics.user_profile_exists = true;
                    console.log('User profile found');
                } else {
                    diagnostics.potential_issues.push('User profile missing in user_profiles table');
                    diagnostics.recommendations.push('Create user profile entry');
                }
            }

            // 3. Check admin_users table
            console.log('Checking admin_users table...');
            const adminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${diagnostics.user_details.id}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (adminResponse.ok) {
                const adminData = await adminResponse.json();
                if (adminData.length > 0) {
                    diagnostics.admin_record_exists = true;
                    diagnostics.admin_permissions = adminData[0].permissions;
                    console.log('Admin record found with permissions:', adminData[0].permissions);
                } else {
                    diagnostics.potential_issues.push('Admin record missing in admin_users table');
                    diagnostics.recommendations.push('Create admin_users entry with proper permissions');
                }
            }
        }

        // 4. Test password login if credentials provided
        if (email && password) {
            console.log('Testing password login...');
            try {
                const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                    method: 'POST',
                    headers: {
                        'apikey': anonKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    diagnostics.password_login_test = {
                        status: 'success',
                        access_token_length: loginData.access_token?.length || 0,
                        expires_in: loginData.expires_in,
                        token_type: loginData.token_type
                    };
                    console.log('Password login successful');
                } else {
                    const errorData = await loginResponse.text();
                    diagnostics.password_login_test = {
                        status: 'failed',
                        error: errorData
                    };
                    diagnostics.potential_issues.push(`Password login failed: ${errorData}`);
                    
                    if (errorData.includes('Invalid login credentials')) {
                        diagnostics.recommendations.push('Check if password is correct or needs to be reset');
                    }
                    if (errorData.includes('Email not confirmed')) {
                        diagnostics.recommendations.push('Email needs to be confirmed');
                    }
                }
            } catch (loginError) {
                diagnostics.password_login_test = {
                    status: 'error',
                    error: loginError.message
                };
                diagnostics.potential_issues.push(`Login test error: ${loginError.message}`);
            }
        }

        // 5. Generate summary and additional recommendations
        if (diagnostics.user_exists_in_auth && diagnostics.user_profile_exists && diagnostics.admin_record_exists) {
            if (diagnostics.password_login_test?.status === 'success') {
                diagnostics.recommendations.push('User setup is complete and login should work');
            } else {
                diagnostics.recommendations.push('User setup is complete but password login is failing - check credentials');
            }
        } else {
            diagnostics.recommendations.push('User setup is incomplete - missing required database entries');
        }

        const result = {
            data: {
                email: email,
                timestamp: new Date().toISOString(),
                diagnostics: diagnostics,
                summary: {
                    auth_user_exists: diagnostics.user_exists_in_auth,
                    profile_exists: diagnostics.user_profile_exists,
                    admin_exists: diagnostics.admin_record_exists,
                    login_works: diagnostics.password_login_test?.status === 'success',
                    total_issues: diagnostics.potential_issues.length,
                    setup_complete: diagnostics.user_exists_in_auth && diagnostics.user_profile_exists && diagnostics.admin_record_exists
                }
            }
        };

        console.log('Auth diagnostics completed:', result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auth diagnostics error:', error);

        const errorResponse = {
            error: {
                code: 'AUTH_DIAGNOSTICS_FAILED',
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