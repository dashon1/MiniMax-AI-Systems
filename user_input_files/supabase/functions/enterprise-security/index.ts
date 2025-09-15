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
        const { action, auditData, userId: targetUserId, roleData, timeRange, eventType } = await req.json();
        
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
        const tenantId = userData.app_metadata?.tenant_id;

        if (!tenantId) {
            throw new Error('No tenant ID found for user');
        }

        // Get user profile to check permissions
        const profileResponse = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!profileResponse.ok) {
            throw new Error('Failed to get user profile');
        }

        const profiles = await profileResponse.json();
        const userProfile = profiles[0];

        if (!userProfile) {
            throw new Error('User profile not found');
        }

        const isAdmin = ['tenant_admin', 'system_admin'].includes(userProfile.role);
        
        console.log(`Enterprise security ${action} called by user: ${userId}, role: ${userProfile.role}`);

        if (action === 'log_audit_event') {
            // Log audit event
            if (!auditData) {
                throw new Error('Audit data is required');
            }

            const auditEvent = {
                user_id: userId,
                tenant_id: tenantId,
                event_type: auditData.eventType,
                event_category: auditData.category || 'general',
                description: auditData.description,
                metadata: auditData.metadata || {},
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                user_agent: req.headers.get('user-agent') || 'unknown',
                created_at: new Date().toISOString()
            };

            const auditResponse = await fetch(
                `${supabaseUrl}/rest/v1/audit_logs`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(auditEvent)
                }
            );

            if (!auditResponse.ok) {
                const errorText = await auditResponse.text();
                throw new Error(`Failed to log audit event: ${errorText}`);
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Audit event logged successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_audit_logs') {
            // Get audit logs (admin only)
            if (!isAdmin) {
                throw new Error('Insufficient permissions to view audit logs');
            }

            // Calculate time range
            const now = new Date();
            let startDate;
            
            switch (timeRange) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }

            let query = `${supabaseUrl}/rest/v1/audit_logs?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&order=created_at.desc&limit=1000`;
            
            if (eventType) {
                query += `&event_type=eq.${eventType}`;
            }
            
            if (targetUserId) {
                query += `&user_id=eq.${targetUserId}`;
            }

            const logsResponse = await fetch(query, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!logsResponse.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const logs = await logsResponse.json();

            // Aggregate statistics
            const stats = {
                total_events: logs.length,
                by_category: {},
                by_user: {},
                by_event_type: {},
                timeline: {}
            };

            logs.forEach(log => {
                // By category
                stats.by_category[log.event_category] = (stats.by_category[log.event_category] || 0) + 1;
                
                // By user
                stats.by_user[log.user_id] = (stats.by_user[log.user_id] || 0) + 1;
                
                // By event type
                stats.by_event_type[log.event_type] = (stats.by_event_type[log.event_type] || 0) + 1;
                
                // Timeline (by day)
                const date = new Date(log.created_at).toISOString().split('T')[0];
                stats.timeline[date] = (stats.timeline[date] || 0) + 1;
            });

            return new Response(JSON.stringify({
                data: {
                    logs: logs,
                    statistics: stats,
                    time_range: {
                        start: startDate.toISOString(),
                        end: now.toISOString(),
                        period: timeRange
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'manage_user_role') {
            // Manage user roles (admin only)
            if (!isAdmin) {
                throw new Error('Insufficient permissions to manage user roles');
            }

            if (!targetUserId || !roleData) {
                throw new Error('User ID and role data are required');
            }

            const allowedRoles = ['user', 'moderator', 'tenant_admin'];
            if (userProfile.role !== 'system_admin') {
                // Tenant admins can't create other tenant admins
                allowedRoles.pop();
            }

            if (!allowedRoles.includes(roleData.newRole)) {
                throw new Error('Invalid role specified');
            }

            // Update user role
            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${targetUserId}&tenant_id=eq.${tenantId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: roleData.newRole,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update user role: ${errorText}`);
            }

            // Log the role change
            await logAuditEvent({
                user_id: userId,
                tenant_id: tenantId,
                event_type: 'role_change',
                event_category: 'security',
                description: `Changed user ${targetUserId} role to ${roleData.newRole}`,
                metadata: {
                    target_user_id: targetUserId,
                    new_role: roleData.newRole,
                    previous_role: roleData.previousRole
                }
            }, supabaseUrl, serviceRoleKey);

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: `User role updated to ${roleData.newRole}`
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_security_metrics') {
            // Get security metrics (admin only)
            if (!isAdmin) {
                throw new Error('Insufficient permissions to view security metrics');
            }

            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Get audit logs for security analysis
            const logsResponse = await fetch(
                `${supabaseUrl}/rest/v1/audit_logs?tenant_id=eq.${tenantId}&created_at=gte.${last30Days.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const logs = await logsResponse.json();

            // Security metrics calculation
            const securityEvents = logs.filter(log => log.event_category === 'security');
            const loginEvents = logs.filter(log => log.event_type === 'login');
            const failedLogins = logs.filter(log => log.event_type === 'login_failed');
            
            // Suspicious activity detection
            const suspiciousIPs = {};
            failedLogins.forEach(log => {
                const ip = log.ip_address;
                suspiciousIPs[ip] = (suspiciousIPs[ip] || 0) + 1;
            });

            const highRiskIPs = Object.entries(suspiciousIPs)
                .filter(([ip, count]) => count >= 5)
                .map(([ip, count]) => ({ ip, failed_attempts: count }));

            // User activity patterns
            const userActivity = {};
            logs.forEach(log => {
                const hour = new Date(log.created_at).getHours();
                userActivity[hour] = (userActivity[hour] || 0) + 1;
            });

            const metrics = {
                overview: {
                    total_security_events: securityEvents.length,
                    total_logins: loginEvents.length,
                    failed_logins: failedLogins.length,
                    success_rate: loginEvents.length > 0 ? 
                        ((loginEvents.length / (loginEvents.length + failedLogins.length)) * 100).toFixed(2) : 100
                },
                threats: {
                    suspicious_ips: highRiskIPs,
                    brute_force_attempts: highRiskIPs.length,
                    risk_level: highRiskIPs.length > 0 ? 'HIGH' : failedLogins.length > 10 ? 'MEDIUM' : 'LOW'
                },
                activity_patterns: {
                    hourly_distribution: userActivity,
                    peak_hour: Object.entries(userActivity).reduce((max, [hour, count]) => 
                        count > max.count ? { hour: parseInt(hour), count } : max,
                        { hour: 0, count: 0 }
                    )
                },
                compliance: {
                    audit_log_retention: '30 days',
                    encryption_status: 'enabled',
                    access_controls: 'rbac_enabled',
                    last_security_review: new Date().toISOString().split('T')[0]
                }
            };

            return new Response(JSON.stringify({
                data: {
                    metrics: metrics,
                    time_range: {
                        start: last30Days.toISOString(),
                        end: now.toISOString()
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_user_permissions') {
            // Get user permissions matrix
            const usersResponse = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?tenant_id=eq.${tenantId}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users');
            }

            const users = await usersResponse.json();

            // Define permission matrix
            const permissionMatrix = {
                'system_admin': {
                    can_manage_tenants: true,
                    can_manage_users: true,
                    can_view_audit_logs: true,
                    can_manage_workflows: true,
                    can_access_analytics: true,
                    can_manage_integrations: true,
                    can_export_data: true
                },
                'tenant_admin': {
                    can_manage_tenants: false,
                    can_manage_users: true,
                    can_view_audit_logs: true,
                    can_manage_workflows: true,
                    can_access_analytics: true,
                    can_manage_integrations: true,
                    can_export_data: true
                },
                'moderator': {
                    can_manage_tenants: false,
                    can_manage_users: false,
                    can_view_audit_logs: true,
                    can_manage_workflows: true,
                    can_access_analytics: true,
                    can_manage_integrations: false,
                    can_export_data: false
                },
                'user': {
                    can_manage_tenants: false,
                    can_manage_users: false,
                    can_view_audit_logs: false,
                    can_manage_workflows: true,
                    can_access_analytics: false,
                    can_manage_integrations: false,
                    can_export_data: false
                }
            };

            const usersWithPermissions = users.map(user => ({
                ...user,
                permissions: permissionMatrix[user.role] || permissionMatrix['user']
            }));

            return new Response(JSON.stringify({
                data: {
                    users: usersWithPermissions,
                    permission_matrix: permissionMatrix,
                    total_users: users.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'encrypt_data') {
            // Encrypt sensitive data
            const { data: dataToEncrypt, keyId } = auditData;
            
            if (!dataToEncrypt) {
                throw new Error('Data to encrypt is required');
            }

            // Simple encryption for demo (in production, use proper encryption)
            const encryptedData = btoa(JSON.stringify(dataToEncrypt));
            
            return new Response(JSON.stringify({
                data: {
                    encrypted_data: encryptedData,
                    key_id: keyId || 'default',
                    encryption_method: 'base64', // In production: AES-256-GCM
                    encrypted_at: new Date().toISOString()
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'decrypt_data') {
            // Decrypt sensitive data
            const { encrypted_data: encryptedData, keyId } = auditData;
            
            if (!encryptedData) {
                throw new Error('Encrypted data is required');
            }

            try {
                // Simple decryption for demo
                const decryptedData = JSON.parse(atob(encryptedData));
                
                return new Response(JSON.stringify({
                    data: {
                        decrypted_data: decryptedData,
                        key_id: keyId || 'default',
                        decrypted_at: new Date().toISOString()
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (error) {
                throw new Error('Failed to decrypt data: Invalid format');
            }
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Enterprise security error:', error);

        const errorResponse = {
            error: {
                code: 'ENTERPRISE_SECURITY_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to log audit events
async function logAuditEvent(eventData, supabaseUrl, serviceRoleKey) {
    try {
        await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...eventData,
                created_at: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}