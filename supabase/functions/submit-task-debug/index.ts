import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
        console.log('=== DEBUG SUBMIT-TASK REQUEST ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Headers:', Object.fromEntries(req.headers.entries()));
        
        // Get raw request body for debugging
        const rawBody = await req.text();
        console.log('Raw body:', rawBody);
        console.log('Raw body length:', rawBody.length);
        
        // Try to parse as JSON
        let requestData;
        try {
            requestData = JSON.parse(rawBody);
            console.log('Parsed request data:', JSON.stringify(requestData, null, 2));
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error(`Invalid JSON in request body: ${parseError.message}`);
        }
        
        const { task } = requestData;
        console.log('Extracted task:', task);
        console.log('Task type:', typeof task);
        console.log('Task keys:', task ? Object.keys(task) : 'null/undefined');

        if (!task) {
            console.error('No task data found in request');
            console.log('Available keys in request:', Object.keys(requestData));
            throw new Error('Task data is required');
        }
        
        // Validate required task fields
        const requiredFields = ['user_id', 'task_content', 'selected_agent'];
        for (const field of requiredFields) {
            if (!task[field]) {
                console.error(`Missing required field: ${field}`);
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        console.log('Task validation passed, proceeding with database insertion');

        // Create Supabase client with service role key for elevated privileges
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );
        
        console.log('Inserting task into database...');

        // Insert task into database using admin client (bypasses RLS)
        const { data: insertedTask, error: insertError } = await supabaseAdmin
            .from('tasks')
            .insert(task)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting task:', insertError);
            throw new Error(`Failed to insert task: ${insertError.message}`);
        }

        console.log('Task inserted successfully:', insertedTask.id);

        // Trigger the AI processing pipeline
        try {
            console.log('Triggering AI processing pipeline...');
            const { data: processResult, error: processError } = await supabaseAdmin.functions.invoke(
                'process-task',
                {
                    body: { record: insertedTask }
                }
            );

            if (processError) {
                console.error('Error invoking process-task:', processError);
                // Don't fail the entire operation if AI processing fails
                // The task is still saved successfully
            } else {
                console.log('AI processing triggered successfully');
            }
        } catch (processInvokeError) {
            console.error('Error invoking AI processing:', processInvokeError);
            // Continue - task insertion was successful
        }

        console.log('=== SUCCESS: Task submission completed ===');
        
        // Return success response with the inserted task
        return new Response(JSON.stringify({ 
            data: insertedTask,
            message: 'Task submitted successfully',
            debug: {
                receivedData: !!requestData,
                taskExtracted: !!task,
                requestBodyLength: rawBody.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('=== ERROR: Submit-task function failed ===');
        console.error('Error details:', error);
        console.error('Error stack:', error.stack);
        
        // Return error response
        const errorResponse = {
            error: {
                code: 'TASK_SUBMISSION_ERROR',
                message: error.message || 'Failed to submit task',
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});