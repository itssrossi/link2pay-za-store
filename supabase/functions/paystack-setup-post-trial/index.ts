import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  email: string;
  fullName: string;
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
    const { email, fullName }: PaymentRequest = await req.json();

    // Get user profile with trial and subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_used, trial_ends_at, has_active_subscription, paystack_customer_code, subscription_price, discount_applied')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('User profile not found');
    }

    if (profile.has_active_subscription) {
      throw new Error('User already has an active subscription');
    }

    if (!profile.trial_used) {
      throw new Error('User has not used their trial yet');
    }

    // Check if trial has expired
    const trialEndDate = new Date(profile.trial_ends_at);
    const now = new Date();
    if (now < trialEndDate) {
      throw new Error('Trial has not expired yet');
    }

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    console.log(`Setting up post-trial payment for user ${user.id} with email ${email}`);

    // Get customer code (should already exist from trial)
    const customerCode = profile.paystack_customer_code;
    if (!customerCode) {
      throw new Error('Customer not found in Paystack');
    }

    // Get subscription price from profile (set during trial)
    const finalPrice = (profile.subscription_price || 95) * 100; // Convert to kobo
    const planName = profile.discount_applied ? 'Link2Pay Beta Plan' : 'Link2Pay Standard Plan';

    // Find or create plan
    const listPlansResponse = await fetch('https://api.paystack.co/plan', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const listPlansData = await listPlansResponse.json();
    console.log('List plans response:', listPlansData);

    let planCode: string;
    const existingPlan = listPlansData.data?.find((plan: any) => 
      plan.name === planName && plan.amount === finalPrice
    );

    if (existingPlan) {
      planCode = existingPlan.plan_code;
      console.log('Using existing plan:', planCode);
    } else {
      // Create new plan
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
        }),
      });

      const planData = await planResponse.json();
      console.log('Plan creation response:', planData);

      if (!planResponse.ok) {
        throw new Error(`Failed to create plan: ${planData.message}`);
      }

      planCode = planData.data.plan_code;
      console.log('Created new plan:', planCode);
    }

    // Initialize payment for subscription setup
    const origin = req.headers.get('origin') || 'http://localhost:8080';
    const initializeResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: finalPrice,
        currency: 'ZAR',
        callback_url: `${origin}/dashboard?payment=success`,
        metadata: {
          user_id: user.id,
          plan_code: planCode,
          customer_code: customerCode,
          subscription_setup: true,
          post_trial_payment: true,
          final_price: finalPrice,
        },
      }),
    });

    const initializeData = await initializeResponse.json();
    console.log('Payment initialization response:', initializeData);

    if (!initializeResponse.ok) {
      throw new Error(`Failed to initialize payment: ${initializeData.message}`);
    }

    // Return the checkout URL for frontend redirect
    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: initializeData.data.authorization_url,
        access_code: initializeData.data.access_code,
        reference: initializeData.data.reference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Post-trial payment setup error:', error);
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