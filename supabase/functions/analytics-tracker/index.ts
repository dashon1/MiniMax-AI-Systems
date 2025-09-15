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
        const { action, metricName, metricValue = 1, category, timePeriod = 'current', source, additionalData = {} } = await req.json();
        
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

        let result = {};

        if (action === 'track') {
            // Track a new metric
            if (!metricName || !category || !source) {
                throw new Error('metricName, category, and source are required for tracking');
            }

            const metricRecord = {
                tenant_id: tenantId,
                user_id: userId,
                metric_name: metricName,
                metric_value: parseFloat(metricValue),
                metric_category: category,
                time_period: timePeriod,
                data_source: source,
                additional_data: additionalData,
                recorded_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(metricRecord)
            });

            if (!insertResponse.ok) {
                const errorText = await insertResponse.text();
                throw new Error(`Failed to track metric: ${errorText}`);
            }

            const trackedMetric = await insertResponse.json();
            result = {
                type: 'metric-tracked',
                metric: trackedMetric[0] || trackedMetric
            };
        } else if (action === 'get-metrics') {
            // Get metrics for the user/tenant
            let query = `tenant_id=eq.${tenantId}`;
            
            if (category) {
                query += `&metric_category=eq.${category}`;
            }
            
            if (metricName) {
                query += `&metric_name=eq.${metricName}`;
            }

            const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_data?${query}&order=recorded_at.desc&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!metricsResponse.ok) {
                throw new Error('Failed to fetch metrics');
            }

            const metrics = await metricsResponse.json();
            result = {
                type: 'metrics-retrieved',
                metrics: metrics,
                count: metrics.length
            };
        } else if (action === 'get-summary') {
            // Get summarized analytics data
            const summaryResponse = await fetch(`${supabaseUrl}/rest/v1/analytics_data?tenant_id=eq.${tenantId}&order=recorded_at.desc&limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (!summaryResponse.ok) {
                throw new Error('Failed to fetch analytics summary');
            }

            const allMetrics = await summaryResponse.json();
            
            // Process metrics into summary
            const summary = {
                total_metrics: allMetrics.length,
                categories: {},
                recent_activity: allMetrics.slice(0, 10),
                top_metrics: {}
            };

            // Group by category
            for (const metric of allMetrics) {
                if (!summary.categories[metric.metric_category]) {
                    summary.categories[metric.metric_category] = {
                        count: 0,
                        total_value: 0,
                        metrics: {}
                    };
                }
                
                const category = summary.categories[metric.metric_category];
                category.count += 1;
                category.total_value += parseFloat(metric.metric_value) || 0;
                
                if (!category.metrics[metric.metric_name]) {
                    category.metrics[metric.metric_name] = 0;
                }
                category.metrics[metric.metric_name] += parseFloat(metric.metric_value) || 0;
            }

            result = {
                type: 'summary-retrieved',
                summary: summary
            };
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Analytics tracking error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_TRACKING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});