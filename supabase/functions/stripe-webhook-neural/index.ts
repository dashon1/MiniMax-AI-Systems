Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    
    if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
      throw new Error('Missing required environment variables');
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    // Parse webhook payload
    const event = JSON.parse(body);
    console.log('Webhook event type:', event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email || session.metadata?.customer_email;
        const planType = session.metadata?.plan_type || 'pro';
        
        if (!customerEmail) {
          console.error('No customer email found in session');
          break;
        }

        // Get user by email
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });

        if (!userResponse.ok) {
          console.error('Failed to fetch users from Supabase');
          break;
        }

        const users = await userResponse.json();
        const user = users.users?.find((u: any) => u.email === customerEmail);
        
        if (!user) {
          console.error('User not found:', customerEmail);
          break;
        }

        // Create or update subscription
        const subscriptionData = {
          user_id: user.id,
          stripe_subscription_id: session.subscription || session.id,
          stripe_customer_id: session.customer,
          price_id: planType === 'pro' ? 'price_pro_aeros' : 'price_standard_aeros',
          status: 'active',
          plan_type: planType,
          current_credits: planType === 'pro' ? 2000 : 100,
          credit_limit: planType === 'pro' ? 2000 : 100,
          credits_used_this_month: 0,
          billing_cycle_start: new Date().toISOString()
        };

        const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/neural_subscriptions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(subscriptionData)
        });

        if (!supabaseResponse.ok) {
          const errorText = await supabaseResponse.text();
          console.error('Failed to create subscription:', errorText);
        } else {
          console.log('Subscription created successfully for user:', user.id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        // Reset monthly credits for the new billing cycle
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/neural_subscriptions?stripe_subscription_id=eq.${subscriptionId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            credits_used_this_month: 0,
            billing_cycle_start: new Date().toISOString(),
            status: 'active'
          })
        });

        if (updateResponse.ok) {
          console.log('Credits reset for subscription:', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Update subscription status to cancelled
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/neural_subscriptions?stripe_subscription_id=eq.${subscription.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            status: 'cancelled',
            plan_type: 'standard',
            current_credits: 100,
            credit_limit: 100
          })
        });

        if (updateResponse.ok) {
          console.log('Subscription cancelled:', subscription.id);
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: {
        code: 'WEBHOOK_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});