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
        const { user_id } = requestData;

        if (!user_id) {
            throw new Error('User ID is required');
        }

        console.log('Provisioning subscription for user:', user_id);

        // Create Supabase client with service role key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Check if user already has a subscription
        const { data: existingSubscription, error: checkError } = await supabaseAdmin
            .from('neural_subscriptions')
            .select('id')
            .eq('user_id', user_id)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking existing subscription:', checkError);
            throw new Error(`Failed to check existing subscription: ${checkError.message}`);
        }

        if (existingSubscription) {
            console.log('User already has subscription:', existingSubscription.id);
            return new Response(JSON.stringify({
                data: { message: 'Subscription already exists', subscription_id: existingSubscription.id },
                success: true
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create default subscription for new user
        const defaultSubscription = {
            user_id: user_id,
            status: 'active',
            plan_type: 'standard',
            current_credits: 100,
            credit_limit: 100,
            credits_used_this_month: 0,
            billing_cycle_start: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating default subscription:', defaultSubscription);

        const { data: newSubscription, error: createError } = await supabaseAdmin
            .from('neural_subscriptions')
            .insert(defaultSubscription)
            .select()
            .single();

        if (createError) {
            console.error('Error creating subscription:', createError);
            throw new Error(`Failed to create subscription: ${createError.message}`);
        }

        console.log('Default subscription created successfully:', newSubscription.id);

        return new Response(JSON.stringify({
            data: {
                subscription: newSubscription,
                message: 'Default subscription created successfully'
            },
            success: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Subscription provisioning error:', error);
        
        return new Response(JSON.stringify({
            error: {
                code: 'SUBSCRIPTION_PROVISIONING_ERROR',
                message: error.message || 'Failed to provision subscription'
            },
            success: false
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});