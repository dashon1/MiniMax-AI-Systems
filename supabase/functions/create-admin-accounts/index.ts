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
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Creating three admin accounts for AEROS platform...');

        // Define the three admin accounts to create
        const adminAccounts = [
            {
                email: 'ara-m5dashboard@gmail.com',
                password: 'Aratest25',
                role: 'Super Admin',
                name: 'ARA M5 Dashboard Admin'
            },
            {
                email: 'ara-m5info@gmail.com',
                password: 'Aratest25',
                role: 'Super Admin',
                name: 'ARA M5 Info Admin'
            },
            {
                email: 'ara-m5admin@gmail.com',
                password: 'Aratest25',
                role: 'Super Admin',
                name: 'ARA M5 Admin'
            }
        ];

        const createdAccounts = [];
        const errors = [];

        for (const account of adminAccounts) {
            try {
                console.log(`Creating account for ${account.email}...`);

                // Step 1: Create the user in Supabase Auth
                const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: account.email,
                        password: account.password,
                        email_confirm: true, // Auto-confirm the email
                        user_metadata: {
                            full_name: account.name,
                            role: account.role
                        }
                    })
                });

                if (!authResponse.ok) {
                    const errorData = await authResponse.text();
                    console.error(`Failed to create auth user for ${account.email}:`, errorData);
                    
                    // Check if user already exists
                    if (errorData.includes('already registered') || errorData.includes('already been taken')) {
                        console.log(`User ${account.email} already exists, proceeding with existing user...`);
                        
                        // Get existing user
                        const getUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(account.email)}`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        
                        if (!getUserResponse.ok) {
                            throw new Error(`Failed to get existing user ${account.email}`);
                        }
                        
                        const usersData = await getUserResponse.json();
                        if (!usersData.users || usersData.users.length === 0) {
                            throw new Error(`User ${account.email} not found`);
                        }
                        
                        const existingUser = usersData.users[0];
                        
                        // Update password for existing user
                        const updateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingUser.id}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                password: account.password,
                                email_confirm: true,
                                user_metadata: {
                                    full_name: account.name,
                                    role: account.role
                                }
                            })
                        });
                        
                        if (!updateResponse.ok) {
                            const updateError = await updateResponse.text();
                            console.error(`Failed to update user ${account.email}:`, updateError);
                        }
                        
                        var user = existingUser;
                    } else {
                        throw new Error(`Failed to create user ${account.email}: ${errorData}`);
                    }
                } else {
                    const userData = await authResponse.json();
                    var user = userData;
                    console.log(`Successfully created auth user for ${account.email}`);
                }

                // Step 2: Create user profile
                console.log(`Creating user profile for ${account.email}...`);
                const profileData = {
                    user_id: user.id,
                    email: account.email,
                    full_name: account.name,
                    plan_type: 'enterprise',
                    subscription_tier: 'enterprise',
                    subscription_status: 'active',
                    monthly_limit: 999999,
                    usage_count: 0,
                    timezone: 'UTC',
                    notification_preferences: {
                        push: true,
                        email: true
                    }
                };

                // Check if profile already exists
                const existingProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (existingProfileResponse.ok) {
                    const existingProfiles = await existingProfileResponse.json();
                    if (existingProfiles.length > 0) {
                        // Update existing profile
                        const updateProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(profileData)
                        });
                        
                        if (!updateProfileResponse.ok) {
                            const updateError = await updateProfileResponse.text();
                            console.error(`Failed to update profile for ${account.email}:`, updateError);
                        } else {
                            console.log(`Updated profile for ${account.email}`);
                        }
                    } else {
                        // Create new profile
                        const createProfileResponse = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(profileData)
                        });
                        
                        if (!createProfileResponse.ok) {
                            const createError = await createProfileResponse.text();
                            console.error(`Failed to create profile for ${account.email}:`, createError);
                        } else {
                            console.log(`Created profile for ${account.email}`);
                        }
                    }
                }

                // Step 3: Create admin user entry with super admin privileges
                console.log(`Creating admin privileges for ${account.email}...`);
                const adminData = {
                    user_id: user.id,
                    admin_level: 'super_admin',
                    permissions: {
                        manage_users: true,
                        view_analytics: true,
                        manage_subscriptions: true,
                        manage_apis: true,
                        system_admin: true,
                        super_admin: true,
                        full_access: true
                    },
                    granted_by: null, // System-created
                    granted_at: new Date().toISOString()
                };

                // Check if admin entry already exists
                const existingAdminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (existingAdminResponse.ok) {
                    const existingAdmins = await existingAdminResponse.json();
                    if (existingAdmins.length > 0) {
                        // Update existing admin
                        const updateAdminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users?user_id=eq.${user.id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(adminData)
                        });
                        
                        if (!updateAdminResponse.ok) {
                            const updateError = await updateAdminResponse.text();
                            console.error(`Failed to update admin for ${account.email}:`, updateError);
                        } else {
                            console.log(`Updated admin privileges for ${account.email}`);
                        }
                    } else {
                        // Create new admin
                        const createAdminResponse = await fetch(`${supabaseUrl}/rest/v1/admin_users`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(adminData)
                        });
                        
                        if (!createAdminResponse.ok) {
                            const createError = await createAdminResponse.text();
                            console.error(`Failed to create admin for ${account.email}:`, createError);
                        } else {
                            console.log(`Created admin privileges for ${account.email}`);
                        }
                    }
                }

                createdAccounts.push({
                    email: account.email,
                    user_id: user.id,
                    role: account.role,
                    status: 'success',
                    message: 'Account created/updated successfully with super admin privileges'
                });

                console.log(`Successfully set up admin account for ${account.email}`);

            } catch (accountError) {
                console.error(`Error creating account ${account.email}:`, accountError.message);
                errors.push({
                    email: account.email,
                    error: accountError.message
                });
            }
        }

        const result = {
            data: {
                message: 'Admin account creation process completed',
                created_accounts: createdAccounts,
                errors: errors,
                summary: {
                    total_accounts: adminAccounts.length,
                    successful: createdAccounts.length,
                    failed: errors.length
                }
            }
        };

        console.log('Admin account creation completed:', result);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Admin account creation error:', error);

        const errorResponse = {
            error: {
                code: 'ADMIN_ACCOUNT_CREATION_FAILED',
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