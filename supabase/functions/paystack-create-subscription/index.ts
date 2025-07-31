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

    // Check if user has already used their trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used, paystack_customer_code')
      .eq('id', user.id)
      .single();

    if (profile?.trial_used) {
      throw new Error('Trial has already been used for this account');
    }

    // Validate promo code and calculate price
    let finalPrice = 9500; // R95.00 in kobo (Paystack uses kobo for ZAR)
    let promoApplied = false;

    if (promoCode === 'BETA50') {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', 'BETA50')
        .eq('is_active', true)
        .single();

      if (promo) {
        finalPrice = 5000; // R50.00 in kobo
        promoApplied = true;
      }
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.log(`Creating subscription for user ${user.id} with email ${email}`);

    // Step 1: Create or retrieve customer
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

      // Update profile with customer code
      await supabase
        .from('profiles')
        .update({ paystack_customer_code: customerCode })
        .eq('id', user.id);
    }

    // Step 2: Create plan (or use existing)
    const planCode = promoApplied ? 'link2pay-beta50' : 'link2pay-standard';
    const planName = promoApplied ? 'Link2Pay Beta Plan' : 'Link2Pay Standard Plan';

    const planResponse = await fetch('https://api.paystack.co/plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: planName,
        interval: 'monthly',
        amount: finalPrice,
        currency: 'ZAR',
        plan_code: planCode,
      }),
    });

    const planData = await planResponse.json();
    console.log('Plan creation response:', planData);

    // If plan already exists, that's fine
    if (!planResponse.ok && !planData.message?.includes('already exists')) {
      throw new Error(`Failed to create plan: ${planData.message}`);
    }

    // Step 3: Create subscription with 7-day trial
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    const subscriptionResponse = await fetch('https://api.paystack.co/subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: customerCode,
        plan: planCode,
        start_date: trialEndDate.toISOString(),
      }),
    });

    const subscriptionData = await subscriptionResponse.json();
    console.log('Subscription creation response:', subscriptionData);

    if (!subscriptionResponse.ok) {
      throw new Error(`Failed to create subscription: ${subscriptionData.message}`);
    }

    // Step 4: Save subscription to database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        paystack_subscription_code: subscriptionData.data.subscription_code,
        paystack_plan_code: planCode,
        status: 'active',
        start_date: trialEndDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        promo_applied: promoApplied,
        amount: finalPrice / 100, // Convert kobo to rand
        currency: 'ZAR',
      });

    if (subscriptionError) {
      console.error('Database error:', subscriptionError);
      throw new Error('Failed to save subscription to database');
    }

    // Step 5: Mark trial as used
    await supabase
      .from('profiles')
      .update({ 
        trial_used: true,
        trial_ends_at: trialEndDate.toISOString(),
        has_active_subscription: true,
      })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_code: subscriptionData.data.subscription_code,
        trial_end_date: trialEndDate.toISOString(),
        amount: finalPrice / 100,
        promo_applied: promoApplied,
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