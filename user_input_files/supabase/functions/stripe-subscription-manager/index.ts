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
        const { action, planSlug, tenantId, customerEmail } = await req.json();

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!stripeSecretKey || !supabaseUrl || !serviceRoleKey) {
            throw new Error('Required environment variables missing');
        }

        // Use the correct environment variable for Stripe secret key
        const actualStripeSecret = stripeSecretKey;

        switch (action) {
            case 'create_checkout_session':
                return await createCheckoutSession(req, actualStripeSecret, supabaseUrl, serviceRoleKey, planSlug, tenantId, customerEmail, corsHeaders);
            case 'get_subscription_status':
                return await getSubscriptionStatus(supabaseUrl, serviceRoleKey, tenantId, corsHeaders);
            case 'cancel_subscription':
                return await cancelSubscription(actualStripeSecret, supabaseUrl, serviceRoleKey, tenantId, corsHeaders);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }

    } catch (error) {
        console.error('Stripe subscription error:', error);

        const errorResponse = {
            error: {
                code: 'STRIPE_SUBSCRIPTION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function createCheckoutSession(req: Request, stripeSecretKey: string, supabaseUrl: string, serviceRoleKey: string, planSlug: string, tenantId: string, customerEmail: string, corsHeaders: any) {
    // Get plan details
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_plans?slug=eq.${planSlug}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!planResponse.ok) {
        throw new Error('Failed to fetch plan details');
    }

    const plans = await planResponse.json();
    if (plans.length === 0) {
        throw new Error('Plan not found');
    }

    const plan = plans[0];

    // Create Stripe checkout session
    const checkoutParams = new URLSearchParams();
    checkoutParams.append('mode', 'subscription');
    checkoutParams.append('success_url', `${req.headers.get('origin') || 'https://your-domain.com'}/dashboard?subscription=success`);
    checkoutParams.append('cancel_url', `${req.headers.get('origin') || 'https://your-domain.com'}/pricing?subscription=cancelled`);
    checkoutParams.append('customer_email', customerEmail);
    checkoutParams.append('metadata[tenant_id]', tenantId);
    checkoutParams.append('metadata[plan_slug]', planSlug);
    
    // Add line item
    checkoutParams.append('line_items[0][price]', plan.stripe_price_id);
    checkoutParams.append('line_items[0][quantity]', '1');

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: checkoutParams.toString()
    });

    if (!stripeResponse.ok) {
        const errorData = await stripeResponse.text();
        console.error('Stripe checkout session error:', errorData);
        throw new Error(`Failed to create checkout session: ${errorData}`);
    }

    const session = await stripeResponse.json();

    return new Response(JSON.stringify({
        data: {
            checkoutUrl: session.url,
            sessionId: session.id
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function getSubscriptionStatus(supabaseUrl: string, serviceRoleKey: string, tenantId: string, corsHeaders: any) {
    const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?tenant_id=eq.${tenantId}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!subscriptionResponse.ok) {
        throw new Error('Failed to fetch subscription status');
    }

    const subscriptions = await subscriptionResponse.json();
    const subscription = subscriptions[0] || null;

    return new Response(JSON.stringify({
        data: {
            subscription,
            hasActiveSubscription: subscription?.status === 'active'
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function cancelSubscription(stripeSecretKey: string, supabaseUrl: string, serviceRoleKey: string, tenantId: string, corsHeaders: any) {
    // Get current subscription
    const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?tenant_id=eq.${tenantId}&status=eq.active`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    if (!subscriptionResponse.ok) {
        throw new Error('Failed to fetch subscription');
    }

    const subscriptions = await subscriptionResponse.json();
    if (subscriptions.length === 0) {
        throw new Error('No active subscription found');
    }

    const subscription = subscriptions[0];

    // Cancel in Stripe
    const cancelResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscription.stripe_subscription_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!cancelResponse.ok) {
        const errorData = await cancelResponse.text();
        throw new Error(`Failed to cancel subscription: ${errorData}`);
    }

    // Update in database
    await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?id=eq.${subscription.id}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'canceled',
            updated_at: new Date().toISOString()
        })
    });

    return new Response(JSON.stringify({
        data: {
            success: true,
            message: 'Subscription cancelled successfully'
        }
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}