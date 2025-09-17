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
        const requestData = await req.json();
        const { record } = requestData; // Task record from database

        if (!record || !record.id) {
            throw new Error('Task record with ID is required');
        }

        console.log('Processing task:', record.id, 'for agent:', record.selected_agent);

        // Create Supabase client with service role key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Update task status to processing
        const { error: statusUpdateError } = await supabaseAdmin
            .from('tasks')
            .update({ 
                status: 'processing',
                updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

        if (statusUpdateError) {
            console.error('Error updating task status:', statusUpdateError);
        }

        console.log('Task status updated to processing');

        // Process task with appropriate AI agent
        const aiResult = await processWithAI(record);

        console.log('AI processing completed, storing result');

        // Store task result
        const { error: resultError } = await supabaseAdmin
            .from('task_results')
            .insert({
                task_id: record.id,
                agent_response: JSON.stringify(aiResult),
                processing_time_ms: aiResult.metadata?.processingTime || 2500,
                tokens_used: aiResult.metadata?.tokensUsed || 0,
                actual_cost: parseFloat(aiResult.metadata?.costEstimate || '0'),
                created_at: new Date().toISOString()
            });

        if (resultError) {
            console.error('Error storing task result:', resultError);
            throw new Error(`Failed to store result: ${resultError.message}`);
        }

        // Update task status to completed
        const { error: completionError } = await supabaseAdmin
            .from('tasks')
            .update({ 
                status: 'completed',
                updated_at: new Date().toISOString()
            })
            .eq('id', record.id);

        if (completionError) {
            console.error('Error updating task to completed:', completionError);
        }

        console.log('Task processing completed successfully:', record.id);

        return new Response(JSON.stringify({
            data: {
                taskId: record.id,
                status: 'completed',
                result: aiResult,
                message: 'Task processed successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Task processing error:', error);
        
        // Try to update task status to failed if we have the record
        const requestData = await req.json().catch(() => ({}));
        const { record } = requestData;
        
        if (record?.id) {
            try {
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL')!,
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
                );
                
                await supabaseAdmin
                    .from('tasks')
                    .update({ 
                        status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', record.id);
            } catch (updateError) {
                console.error('Failed to update task status to failed:', updateError);
            }
        }

        return new Response(JSON.stringify({
            error: {
                code: 'TASK_PROCESSING_ERROR',
                message: error.message || 'Failed to process task'
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// AI Processing Function
async function processWithAI(task: any) {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
    }

    console.log('Processing with AI agent:', task.selected_agent);

    // Agent-specific prompts and configurations
    const agentConfigs = {
        'genspark': {
            name: 'GenSpark AI',
            systemPrompt: 'You are GenSpark AI, a specialized research and analysis agent. Provide comprehensive, well-researched responses with data-driven insights.',
            icon: '🔍',
            specialty: 'Research & Analysis'
        },
        'minimax': {
            name: 'MiniMax AI',
            systemPrompt: 'You are MiniMax AI, a creative content generation specialist. Create engaging, professional content that meets user requirements.',
            icon: '✨',
            specialty: 'Content Creation'
        },
        'abacus': {
            name: 'Abacus AI',
            systemPrompt: 'You are Abacus AI, a data analysis and computational expert. Provide detailed analytical insights and quantitative solutions.',
            icon: '📊',
            specialty: 'Data Analysis'
        },
        'manus': {
            name: 'Manus AI',
            systemPrompt: 'You are Manus AI, a technical implementation and integration specialist. Focus on practical solutions and technical excellence.',
            icon: '⚙️',
            specialty: 'Technical Implementation'
        },
        'mvp_agent': {
            name: 'MVP Agent',
            systemPrompt: 'You are MVP Agent, a product development specialist. Focus on creating minimum viable solutions and strategic product guidance.',
            icon: '🚀',
            specialty: 'Product Development'
        },
        'fullstack_dev': {
            name: 'FullStack Dev',
            systemPrompt: 'You are FullStack Dev, a complete web development specialist. Provide comprehensive technical solutions for web applications.',
            icon: '💻',
            specialty: 'Web Development'
        },
        'deep_research': {
            name: 'Deep Research',
            systemPrompt: 'You are Deep Research, an advanced research specialist. Conduct thorough investigations and provide detailed analytical reports.',
            icon: '🔬',
            specialty: 'Advanced Research'
        },
        'report_writer': {
            name: 'Report Writer',
            systemPrompt: 'You are Report Writer, a professional documentation specialist. Create comprehensive, well-structured reports and documents.',
            icon: '📝',
            specialty: 'Professional Writing'
        }
    };

    const agentConfig = agentConfigs[task.selected_agent] || agentConfigs['minimax'];
    
    const messages = [
        {
            role: 'system',
            content: `${agentConfig.systemPrompt}\n\nTask Context: You are processing a user task through an AI assistant platform. Provide a comprehensive, professional response that fully addresses the user's request. Format your response clearly with sections and actionable insights where appropriate.`
        },
        {
            role: 'user',
            content: `Task: ${task.task_content}\n\nSelected Agent: ${agentConfig.name} (${agentConfig.specialty})\n\nReasoning: ${task.agent_reasoning || 'Selected based on task requirements'}\n\nPlease provide a comprehensive response to this task.`
        }
    ];

    console.log('Sending request to OpenAI...');
    
    const startTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            max_tokens: 3000,
            temperature: 0.7,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
        throw new Error('No response from AI model');
    }

    const processingTime = Date.now() - startTime;
    
    console.log('AI processing completed in', processingTime, 'ms');

    // Create structured result
    const result = {
        agent: {
            name: agentConfig.name,
            icon: agentConfig.icon,
            specialty: agentConfig.specialty,
            type: task.selected_agent
        },
        task: {
            id: task.id,
            content: task.task_content,
            priority: task.priority,
            reasoning: task.agent_reasoning
        },
        response: {
            content: aiResponse,
            summary: `${agentConfig.name} has successfully processed your ${agentConfig.specialty.toLowerCase()} task.`,
            completedAt: new Date().toISOString()
        },
        metadata: {
            model: 'GPT-4o',
            processingTime: processingTime,
            tokensUsed: data.usage?.total_tokens || 0,
            costEstimate: ((data.usage?.total_tokens || 0) * 0.00003).toFixed(4),
            confidence: 0.95
        }
    };

    return result;
}