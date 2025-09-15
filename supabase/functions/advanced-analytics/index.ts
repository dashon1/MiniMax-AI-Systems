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
        const { action, timeRange, userId: targetUserId, metrics, exportFormat } = await req.json();
        
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

        console.log(`Advanced analytics ${action} called by user: ${userId}`);

        // Calculate time range
        const now = new Date();
        let startDate, endDate;
        
        switch (timeRange) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
        }

        if (action === 'get_task_analytics') {
            // Get task performance analytics
            const tasksResponse = await fetch(
                `${supabaseUrl}/rest/v1/tasks?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&created_at=lte.${endDate.toISOString()}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!tasksResponse.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const tasks = await tasksResponse.json();

            // Calculate analytics
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.status === 'completed').length;
            const failedTasks = tasks.filter(t => t.status === 'failed').length;
            const pendingTasks = tasks.filter(t => t.status === 'pending').length;
            const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

            // Calculate average completion time
            const completedTasksWithTime = tasks.filter(t => t.status === 'completed' && t.completed_at);
            const totalCompletionTime = completedTasksWithTime.reduce((sum, task) => {
                const start = new Date(task.created_at);
                const end = new Date(task.completed_at);
                return sum + (end.getTime() - start.getTime());
            }, 0);
            const averageCompletionTime = completedTasksWithTime.length > 0 
                ? totalCompletionTime / completedTasksWithTime.length 
                : 0;

            // Task categories breakdown
            const tasksByCategory = {};
            tasks.forEach(task => {
                const category = task.category || 'uncategorized';
                tasksByCategory[category] = (tasksByCategory[category] || 0) + 1;
            });

            // Task success rate by agent
            const agentPerformance = {};
            tasks.forEach(task => {
                const agent = task.assigned_agent || 'unknown';
                if (!agentPerformance[agent]) {
                    agentPerformance[agent] = { total: 0, completed: 0, failed: 0 };
                }
                agentPerformance[agent].total++;
                if (task.status === 'completed') agentPerformance[agent].completed++;
                if (task.status === 'failed') agentPerformance[agent].failed++;
            });

            // Daily task distribution
            const dailyTasks = {};
            tasks.forEach(task => {
                const date = new Date(task.created_at).toISOString().split('T')[0];
                dailyTasks[date] = (dailyTasks[date] || 0) + 1;
            });

            return new Response(JSON.stringify({
                data: {
                    summary: {
                        total_tasks: totalTasks,
                        completed_tasks: completedTasks,
                        failed_tasks: failedTasks,
                        pending_tasks: pendingTasks,
                        in_progress_tasks: inProgressTasks,
                        completion_rate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(2) : 0,
                        average_completion_time_ms: Math.round(averageCompletionTime),
                        average_completion_time_formatted: formatDuration(averageCompletionTime)
                    },
                    breakdowns: {
                        by_category: tasksByCategory,
                        by_agent: agentPerformance,
                        by_day: dailyTasks
                    },
                    time_range: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        period: timeRange
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_user_behavior') {
            // Get user behavior analytics
            const activeUsers = new Set();
            const userSessions = {};
            const featureUsage = {};

            // Get task data for user activity
            const tasksResponse = await fetch(
                `${supabaseUrl}/rest/v1/tasks?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&created_at=lte.${endDate.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const tasks = await tasksResponse.json();

            // Get conversation data
            const conversationsResponse = await fetch(
                `${supabaseUrl}/rest/v1/conversations?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&created_at=lte.${endDate.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const conversations = await conversationsResponse.json();

            // Analyze user activity
            tasks.forEach(task => {
                activeUsers.add(task.user_id);
                const date = new Date(task.created_at).toISOString().split('T')[0];
                if (!userSessions[date]) userSessions[date] = new Set();
                userSessions[date].add(task.user_id);
                
                // Track feature usage
                const feature = task.task_type || 'general';
                featureUsage[feature] = (featureUsage[feature] || 0) + 1;
            });

            conversations.forEach(conv => {
                activeUsers.add(conv.user_id);
                const date = new Date(conv.created_at).toISOString().split('T')[0];
                if (!userSessions[date]) userSessions[date] = new Set();
                userSessions[date].add(conv.user_id);
                
                featureUsage['conversation'] = (featureUsage['conversation'] || 0) + 1;
            });

            // Convert sets to counts
            const dailyActiveUsers = {};
            Object.entries(userSessions).forEach(([date, users]) => {
                dailyActiveUsers[date] = users.size;
            });

            return new Response(JSON.stringify({
                data: {
                    summary: {
                        total_active_users: activeUsers.size,
                        average_daily_users: Object.values(dailyActiveUsers).length > 0 
                            ? Math.round(Object.values(dailyActiveUsers).reduce((a, b) => a + b, 0) / Object.values(dailyActiveUsers).length)
                            : 0,
                        peak_usage_day: Object.entries(dailyActiveUsers).reduce((max, [date, count]) => 
                            count > max.count ? { date, count } : max, 
                            { date: null, count: 0 }
                        )
                    },
                    daily_active_users: dailyActiveUsers,
                    feature_usage: featureUsage,
                    time_range: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        period: timeRange
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_productivity_insights') {
            // Get productivity insights
            const tasksResponse = await fetch(
                `${supabaseUrl}/rest/v1/tasks?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&created_at=lte.${endDate.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const tasks = await tasksResponse.json();

            // Peak usage hours
            const hourlyUsage = {};
            tasks.forEach(task => {
                const hour = new Date(task.created_at).getHours();
                hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
            });

            const peakHour = Object.entries(hourlyUsage).reduce((max, [hour, count]) => 
                count > max.count ? { hour: parseInt(hour), count } : max,
                { hour: 0, count: 0 }
            );

            // Task complexity analysis
            const complexityAnalysis = {
                simple: tasks.filter(t => (t.processing_time_ms || 0) < 5000).length,
                medium: tasks.filter(t => (t.processing_time_ms || 0) >= 5000 && (t.processing_time_ms || 0) < 30000).length,
                complex: tasks.filter(t => (t.processing_time_ms || 0) >= 30000).length
            };

            // User efficiency trends
            const userEfficiency = {};
            tasks.forEach(task => {
                const user = task.user_id;
                if (!userEfficiency[user]) {
                    userEfficiency[user] = { completed: 0, total: 0, avgTime: 0 };
                }
                userEfficiency[user].total++;
                if (task.status === 'completed') {
                    userEfficiency[user].completed++;
                    if (task.processing_time_ms) {
                        userEfficiency[user].avgTime += task.processing_time_ms;
                    }
                }
            });

            // Calculate efficiency scores
            Object.values(userEfficiency).forEach(user => {
                user.efficiency_score = user.total > 0 ? (user.completed / user.total * 100).toFixed(2) : 0;
                user.avgTime = user.completed > 0 ? Math.round(user.avgTime / user.completed) : 0;
            });

            return new Response(JSON.stringify({
                data: {
                    peak_usage: {
                        hour: peakHour.hour,
                        count: peakHour.count,
                        formatted_time: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`
                    },
                    hourly_distribution: hourlyUsage,
                    task_complexity: complexityAnalysis,
                    user_efficiency: userEfficiency,
                    insights: generateProductivityInsights(tasks, hourlyUsage, peakHour),
                    time_range: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        period: timeRange
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'export_data') {
            // Export analytics data
            const format = exportFormat || 'json';
            
            // Get all data for export
            const tasksResponse = await fetch(
                `${supabaseUrl}/rest/v1/tasks?tenant_id=eq.${tenantId}&created_at=gte.${startDate.toISOString()}&created_at=lte.${endDate.toISOString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            const tasks = await tasksResponse.json();

            if (format === 'csv') {
                // Convert to CSV format
                const csvHeaders = ['Date', 'Task ID', 'User ID', 'Status', 'Category', 'Agent', 'Processing Time (ms)', 'Created At', 'Completed At'];
                const csvRows = tasks.map(task => [
                    new Date(task.created_at).toISOString().split('T')[0],
                    task.id,
                    task.user_id,
                    task.status,
                    task.category || '',
                    task.assigned_agent || '',
                    task.processing_time_ms || '',
                    task.created_at,
                    task.completed_at || ''
                ]);

                const csvContent = [csvHeaders, ...csvRows]
                    .map(row => row.map(field => `"${field}"`).join(','))
                    .join('\n');

                return new Response(csvContent, {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
                    }
                });
            }

            // Default JSON export
            return new Response(JSON.stringify({
                data: {
                    export_format: format,
                    export_date: new Date().toISOString(),
                    time_range: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        period: timeRange
                    },
                    tasks: tasks,
                    summary: {
                        total_records: tasks.length,
                        date_range: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
                    }
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Advanced analytics error:', error);

        const errorResponse = {
            error: {
                code: 'ANALYTICS_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper functions
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function generateProductivityInsights(tasks, hourlyUsage, peakHour) {
    const insights = [];
    
    // Peak hour insight
    if (peakHour.hour >= 9 && peakHour.hour <= 11) {
        insights.push({
            type: 'peak_timing',
            message: 'Peak productivity occurs during morning hours (9-11 AM), indicating optimal morning work patterns.',
            recommendation: 'Schedule important tasks during morning hours for maximum efficiency.'
        });
    } else if (peakHour.hour >= 14 && peakHour.hour <= 16) {
        insights.push({
            type: 'peak_timing',
            message: 'Peak productivity occurs during afternoon hours (2-4 PM), suggesting post-lunch energy peaks.',
            recommendation: 'Consider scheduling complex tasks during afternoon hours.'
        });
    }
    
    // Task completion insight
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    if (completionRate > 90) {
        insights.push({
            type: 'efficiency',
            message: `Excellent task completion rate of ${completionRate.toFixed(1)}%. Team is highly efficient.`,
            recommendation: 'Maintain current workflows and consider taking on more complex challenges.'
        });
    } else if (completionRate < 70) {
        insights.push({
            type: 'efficiency',
            message: `Task completion rate of ${completionRate.toFixed(1)}% suggests room for improvement.`,
            recommendation: 'Review failed tasks and optimize workflows to improve completion rates.'
        });
    }
    
    return insights;
}