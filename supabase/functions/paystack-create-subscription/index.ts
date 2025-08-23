import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  email: string;
  fullName: string;
  promoCode?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Parse request body
    const { email, fullName, promoCode }: SubscriptionRequest = await req.json();

    // Check user's current trial and subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used, trial_started_at, trial_ends_at, has_active_subscription, paystack_customer_code')
      .eq('id', user.id)
      .single();

    if (profile?.has_active_subscription) {
      throw new Error('User already has an active subscription');
    }

    // If user has an active trial, return success with existing trial info
    if (profile?.trial_started_at && profile?.trial_ends_at) {
      const trialEndsAt = new Date(profile.trial_ends_at);
      const now = new Date();
      
      if (trialEndsAt > now) {
        // Trial is still active
        console.log('Trial is already active for user:', user.id);
        return new Response(
          JSON.stringify({
            success: true,
            trial_started: true,
            trial_ends_at: profile.trial_ends_at,
            message: 'Your 7-day free trial is already active! Enjoy full access to all features.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Trial has expired, redirect to payment setup
        throw new Error('Your free trial has expired. Please set up payment to continue using the service.');
      }
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.log(`Starting free trial for user ${user.id} with email ${email}`);

    // Step 1: Create or retrieve customer (for future payment)
    let customerCode = profile?.paystack_customer_code;
    
    if (!customerCode) {
      const customerResponse = await fetch('https://api.paystack.co/customer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: fullName.split(' ')[0],
          last_name: fullName.split(' ').slice(1).join(' '),
          metadata: {
            user_id: user.id,
          },
        }),
      });

      const customerData = await customerResponse.json();
      console.log('Customer creation response:', customerData);

      if (!customerResponse.ok) {
        throw new Error(`Failed to create customer: ${customerData.message}`);
      }

      customerCode = customerData.data.customer_code;
    }

    // Step 2: Start the trial (no payment required)
    const trialStartsAt = new Date();
    const trialEndsAt = new Date(trialStartsAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Store promo code preference for later subscription
    let subscriptionPrice = 15200; // Default R152
    let discountApplied = false;

    if (promoCode === 'BETA50') {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', 'BETA50')
        .eq('is_active', true)
        .single();
      
      if (promo) {
        subscriptionPrice = 9500; // R95 with BETA50
        discountApplied = true;
      }
    }

    // Update profile to start trial
    await supabase
      .from('profiles')
      .update({
        trial_started_at: trialStartsAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        trial_used: true,
        paystack_customer_code: customerCode,
        subscription_price: subscriptionPrice / 100, // Store as rands
        discount_applied: discountApplied,
        // Keep has_active_subscription as false during trial
      })
      .eq('id', user.id);

    console.log('Free trial started successfully for user:', user.id);

    // Return trial confirmation (no checkout URL)
    return new Response(
      JSON.stringify({
        success: true,
        trial_started: true,
        trial_ends_at: trialEndsAt.toISOString(),
        message: 'Your 7-day free trial has started! Enjoy full access to all features.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Subscription creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});