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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not found');
    }

    const requestData = await req.json();
    const { planType, customerEmail } = requestData;

    if (!planType || !customerEmail) {
      throw new Error('planType and customerEmail are required');
    }

    // Determine price ID based on plan type
    let priceId: string;
    switch (planType) {
      case 'standard':
        priceId = 'price_standard_aeros';
        break;
      case 'pro':
        priceId = 'price_pro_aeros';
        break;
      default:
        throw new Error('Invalid plan type');
    }

    // For standard plan (free), just update user subscription
    if (planType === 'standard') {
      // Return success without creating Stripe session
      return new Response(JSON.stringify({ 
        data: { 
          message: 'Standard plan activated',
          planType: 'standard'
        } 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe checkout session for paid plans
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${req.headers.get('origin') || 'http://localhost:3000'}?subscription=success`,
        'cancel_url': `${req.headers.get('origin') || 'http://localhost:3000'}?subscription=cancelled`,
        'customer_email': customerEmail,
        'metadata[plan_type]': planType,
        'metadata[customer_email]': customerEmail
      })
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('Stripe API error:', errorData);
      throw new Error('Failed to create Stripe checkout session');
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

  } catch (error) {
    console.error('Subscription creation error:', error);
    const errorResponse = {
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: error.message || 'Failed to create subscription'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});