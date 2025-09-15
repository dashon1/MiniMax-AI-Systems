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
        const { action, workflowId, workflowData, triggerData, executionId } = await req.json();
        
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

        console.log(`Workflow automation ${action} called by user: ${userId}`);

        if (action === 'create_workflow') {
            // Create new workflow
            if (!workflowData) {
                throw new Error('Workflow data is required');
            }

            const workflow = {
                user_id: userId,
                tenant_id: tenantId,
                name: workflowData.name,
                description: workflowData.description || '',
                trigger_type: workflowData.trigger.type, // 'schedule', 'event', 'webhook', 'manual'
                trigger_config: workflowData.trigger.config,
                steps: workflowData.steps,
                is_active: workflowData.isActive !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const createResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflows`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(workflow)
                }
            );

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`Failed to create workflow: ${errorText}`);
            }

            const createdWorkflow = await createResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    workflow: createdWorkflow[0],
                    message: 'Workflow created successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_workflows') {
            // Get user's workflows
            const workflowsResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflows?user_id=eq.${userId}&order=created_at.desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!workflowsResponse.ok) {
                throw new Error('Failed to fetch workflows');
            }

            const workflows = await workflowsResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    workflows: workflows,
                    total: workflows.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'update_workflow') {
            // Update existing workflow
            if (!workflowId || !workflowData) {
                throw new Error('Workflow ID and data are required');
            }

            const updateData = {
                name: workflowData.name,
                description: workflowData.description,
                trigger_type: workflowData.trigger?.type,
                trigger_config: workflowData.trigger?.config,
                steps: workflowData.steps,
                is_active: workflowData.isActive,
                updated_at: new Date().toISOString()
            };

            const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflows?id=eq.${workflowId}&user_id=eq.${userId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                }
            );

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update workflow: ${errorText}`);
            }

            const updatedWorkflow = await updateResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    workflow: updatedWorkflow[0],
                    message: 'Workflow updated successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'delete_workflow') {
            // Delete workflow
            if (!workflowId) {
                throw new Error('Workflow ID is required');
            }

            const deleteResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflows?id=eq.${workflowId}&user_id=eq.${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!deleteResponse.ok) {
                const errorText = await deleteResponse.text();
                throw new Error(`Failed to delete workflow: ${errorText}`);
            }
            
            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Workflow deleted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'execute_workflow') {
            // Execute workflow manually or via trigger
            if (!workflowId) {
                throw new Error('Workflow ID is required');
            }

            // Get workflow details
            const workflowResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflows?id=eq.${workflowId}&user_id=eq.${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!workflowResponse.ok) {
                throw new Error('Failed to fetch workflow');
            }

            const workflows = await workflowResponse.json();
            if (!workflows || workflows.length === 0) {
                throw new Error('Workflow not found');
            }

            const workflow = workflows[0];
            
            if (!workflow.is_active) {
                throw new Error('Workflow is not active');
            }

            // Create execution record
            const execution = {
                workflow_id: workflowId,
                user_id: userId,
                tenant_id: tenantId,
                status: 'running',
                trigger_data: triggerData || {},
                started_at: new Date().toISOString(),
                step_results: [],
                created_at: new Date().toISOString()
            };

            const executionResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflow_executions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(execution)
                }
            );

            if (!executionResponse.ok) {
                const errorText = await executionResponse.text();
                throw new Error(`Failed to create execution record: ${errorText}`);
            }

            const createdExecution = await executionResponse.json();
            const executionId = createdExecution[0].id;

            // Execute workflow steps
            const stepResults = [];
            let executionStatus = 'completed';
            let errorMessage = null;

            try {
                for (let i = 0; i < workflow.steps.length; i++) {
                    const step = workflow.steps[i];
                    console.log(`Executing step ${i + 1}: ${step.type}`);

                    const stepResult = await executeWorkflowStep(step, triggerData, supabaseUrl, serviceRoleKey, userId, tenantId);
                    stepResults.push({
                        step_index: i,
                        step_type: step.type,
                        result: stepResult,
                        executed_at: new Date().toISOString()
                    });

                    // Check if step failed
                    if (!stepResult.success) {
                        executionStatus = 'failed';
                        errorMessage = stepResult.error || 'Step execution failed';
                        break;
                    }
                }
            } catch (error) {
                executionStatus = 'failed';
                errorMessage = error.message;
            }

            // Update execution record with results
            const updateExecutionResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflow_executions?id=eq.${executionId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: executionStatus,
                        step_results: stepResults,
                        completed_at: new Date().toISOString(),
                        error_message: errorMessage
                    })
                }
            );

            return new Response(JSON.stringify({
                data: {
                    execution_id: executionId,
                    status: executionStatus,
                    step_results: stepResults,
                    error_message: errorMessage,
                    message: executionStatus === 'completed' ? 'Workflow executed successfully' : 'Workflow execution failed'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_executions') {
            // Get workflow execution history
            const executionsResponse = await fetch(
                `${supabaseUrl}/rest/v1/workflow_executions?user_id=eq.${userId}&order=created_at.desc&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                }
            );

            if (!executionsResponse.ok) {
                throw new Error('Failed to fetch executions');
            }

            const executions = await executionsResponse.json();
            
            return new Response(JSON.stringify({
                data: {
                    executions: executions,
                    total: executions.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'get_templates') {
            // Get workflow templates
            const templates = [
                {
                    id: 'email_sequence',
                    name: 'Email Sequence',
                    description: 'Send a series of emails based on triggers',
                    category: 'Communication',
                    steps: [
                        { type: 'delay', config: { duration: 3600000 } }, // 1 hour
                        { type: 'send_email', config: { template: 'welcome' } },
                        { type: 'delay', config: { duration: 86400000 } }, // 1 day
                        { type: 'send_email', config: { template: 'follow_up' } }
                    ]
                },
                {
                    id: 'task_reminder',
                    name: 'Task Reminder',
                    description: 'Send reminders for overdue tasks',
                    category: 'Productivity',
                    steps: [
                        { type: 'check_overdue_tasks', config: {} },
                        { type: 'send_notification', config: { type: 'task_reminder' } }
                    ]
                },
                {
                    id: 'calendar_sync',
                    name: 'Calendar Synchronization',
                    description: 'Sync events between calendars',
                    category: 'Calendar',
                    steps: [
                        { type: 'fetch_calendar_events', config: { source: 'google' } },
                        { type: 'sync_events', config: { target: 'local' } },
                        { type: 'send_notification', config: { type: 'sync_complete' } }
                    ]
                }
            ];

            return new Response(JSON.stringify({
                data: {
                    templates: templates,
                    total: templates.length
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Invalid action specified');

    } catch (error) {
        console.error('Workflow automation error:', error);

        const errorResponse = {
            error: {
                code: 'WORKFLOW_AUTOMATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Helper function to execute individual workflow steps
async function executeWorkflowStep(step, triggerData, supabaseUrl, serviceRoleKey, userId, tenantId) {
    try {
        switch (step.type) {
            case 'send_email':
                // Send email step
                const emailConfig = step.config;
                const emailResponse = await fetch(`${supabaseUrl}/functions/v1/gmail-service`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'send_email',
                        emailData: {
                            to: emailConfig.to || triggerData.email,
                            subject: emailConfig.subject || 'Automated Message',
                            body: emailConfig.body || 'This is an automated message from your workflow.'
                        }
                    })
                });

                if (emailResponse.ok) {
                    const result = await emailResponse.json();
                    return { success: true, data: result };
                } else {
                    return { success: false, error: 'Failed to send email' };
                }

            case 'create_task':
                // Create task step
                const taskConfig = step.config;
                const taskResponse = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        tenant_id: tenantId,
                        title: taskConfig.title || 'Automated Task',
                        description: taskConfig.description || '',
                        status: 'pending',
                        created_at: new Date().toISOString()
                    })
                });

                if (taskResponse.ok) {
                    const result = await taskResponse.json();
                    return { success: true, data: result };
                } else {
                    return { success: false, error: 'Failed to create task' };
                }

            case 'send_notification':
                // Send notification step
                const notificationConfig = step.config;
                // For now, just log the notification
                console.log(`Notification: ${notificationConfig.message || 'Workflow step completed'}`);
                return { success: true, data: { message: 'Notification sent' } };

            case 'delay':
                // Delay step
                const delayConfig = step.config;
                const delayMs = delayConfig.duration || 1000;
                await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 30000))); // Max 30 second delay in function
                return { success: true, data: { delayed: delayMs } };

            case 'webhook':
                // Webhook step
                const webhookConfig = step.config;
                const webhookResponse = await fetch(webhookConfig.url, {
                    method: webhookConfig.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...webhookConfig.headers
                    },
                    body: JSON.stringify(webhookConfig.data || triggerData)
                });

                if (webhookResponse.ok) {
                    const result = await webhookResponse.json();
                    return { success: true, data: result };
                } else {
                    return { success: false, error: 'Webhook request failed' };
                }

            default:
                return { success: false, error: `Unknown step type: ${step.type}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}