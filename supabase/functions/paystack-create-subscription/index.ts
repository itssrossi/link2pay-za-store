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
    const planName = promoApplied ? 'Link2Pay Beta Plan' : 'Link2Pay Standard Plan';
    let planCode: string;

    // First, try to fetch existing plans to see if our plan already exists
    const listPlansResponse = await fetch('https://api.paystack.co/plan', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const listPlansData = await listPlansResponse.json();
    console.log('List plans response:', listPlansData);

    // Check if plan with this name and amount already exists
    const existingPlan = listPlansData.data?.find((plan: any) => 
      plan.name === planName && plan.amount === finalPrice
    );

    if (existingPlan) {
      planCode = existingPlan.plan_code;
      console.log('Using existing plan:', planCode);
    } else {
      // Create new plan without plan_code parameter
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

    // Step 3: Initialize payment for subscription setup
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
        callback_url: `${origin}/billing-setup?trial=success`,
        metadata: {
          user_id: user.id,
          plan_code: planCode,
          customer_code: customerCode,
          subscription_setup: true,
          promo_applied: promoApplied,
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