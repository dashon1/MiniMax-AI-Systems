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
        // Extract task data from request body
        const requestData = await req.json();
        const { task } = requestData;

        if (!task) {
            throw new Error('Task data is required');
        }

        // Create Supabase client with service role key for elevated privileges
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

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

        // Return success response with the inserted task
        return new Response(JSON.stringify({ 
            data: insertedTask,
            message: 'Task submitted successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit-task function error:', error);
        
        // Return error response
        const errorResponse = {
            error: {
                code: 'TASK_SUBMISSION_ERROR',
                message: error.message || 'Failed to submit task'
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});