Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const signature = req.headers.get('stripe-signature');
        const body = await req.text();
        
        // Get environment variables
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Supabase configuration missing');
        }

        // Parse the event (simplified validation)
        let event;
        try {
            event = JSON.parse(body);
        } catch (err) {
            console.error('Invalid JSON received');
            throw new Error('Invalid JSON');
        }

        console.log('Received webhook event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object, supabaseUrl, serviceRoleKey);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function handleCheckoutCompleted(session: any, supabaseUrl: string, serviceRoleKey: string) {
    const tenantId = session.metadata.tenant_id;
    const planSlug = session.metadata.plan_slug;

    if (!tenantId || !planSlug) {
        console.error('Missing tenant_id or plan_slug in session metadata');
        return;
    }

    // Get plan details
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_plans?slug=eq.${planSlug}`, {
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
        }
    });

    const plans = await planResponse.json();
    if (plans.length === 0) {
        console.error('Plan not found:', planSlug);
        return;
    }

    const plan = plans[0];

    // Create or update subscription
    const subscriptionData = {
        tenant_id: tenantId,
        plan_id: plan.id,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Insert subscription
    const subscriptionResponse = await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
    });

    if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Failed to create subscription:', errorText);
    } else {
        console.log('Subscription created successfully for tenant:', tenantId);
    }

    // Update tenant status
    await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${tenantId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'active',
            updated_at: new Date().toISOString()
        })
    });
}

async function handleSubscriptionUpdated(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    const stripeSubscriptionId = subscription.id;
    
    const updateData = {
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
    };

    await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?stripe_subscription_id=eq.${stripeSubscriptionId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    console.log('Subscription updated:', stripeSubscriptionId);
}

async function handleSubscriptionDeleted(subscription: any, supabaseUrl: string, serviceRoleKey: string) {
    const stripeSubscriptionId = subscription.id;
    
    await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?stripe_subscription_id=eq.${stripeSubscriptionId}`, {
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

    console.log('Subscription cancelled:', stripeSubscriptionId);
}

async function handlePaymentSucceeded(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Payment succeeded for subscription:', invoice.subscription);
    // Additional logic for successful payments can be added here
}

async function handlePaymentFailed(invoice: any, supabaseUrl: string, serviceRoleKey: string) {
    console.log('Payment failed for subscription:', invoice.subscription);
    
    // Update subscription status to past_due
    await fetch(`${supabaseUrl}/rest/v1/tenant_subscriptions?stripe_subscription_id=eq.${invoice.subscription}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'past_due',
            updated_at: new Date().toISOString()
        })
    });
}