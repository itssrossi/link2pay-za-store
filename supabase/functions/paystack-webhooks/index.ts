import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createHash } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

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

    // Get webhook secret
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecret) {
      throw new Error('Paystack secret key not configured');
    }

    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();
    
    if (signature) {
      const hash = createHash('sha512');
      hash.update(body);
      const expectedSignature = hash.toString('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log('Received webhook event:', event.event, event.data);

    switch (event.event) {
      case 'subscription.create':
        await handleSubscriptionCreate(supabase, event.data);
        break;
        
      case 'invoice.payment_success':
        await handlePaymentSuccess(supabase, event.data);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisable(supabase, event.data);
        break;
        
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

async function handleSubscriptionCreate(supabase: any, data: any) {
  console.log('Handling subscription create:', data);
  
  // Update subscription status in database
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'active',
      next_billing_date: data.next_payment_date,
    })
    .eq('paystack_subscription_code', data.subscription_code);

  if (error) {
    console.error('Error updating subscription on create:', error);
  }
}

async function handlePaymentSuccess(supabase: any, data: any) {
  console.log('Handling payment success:', data);
  
  // Find subscription by customer
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paystack_subscription_code', data.subscription?.subscription_code)
    .single();

  if (subscription) {
    // Update subscription status and next billing date
    const { error } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        next_billing_date: data.subscription?.next_payment_date,
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Error updating subscription on payment success:', error);
    }

    // Update profile to ensure subscription is active
    await supabase
      .from('profiles')
      .update({ 
        has_active_subscription: true,
        billing_failures: 0,
      })
      .eq('id', subscription.user_id);
  }
}

async function handlePaymentFailed(supabase: any, data: any) {
  console.log('Handling payment failed:', data);
  
  // Find subscription by customer
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('paystack_subscription_code', data.subscription?.subscription_code)
    .single();

  if (subscription) {
    // Update profile to track billing failures
    const { data: profile } = await supabase
      .from('profiles')
      .select('billing_failures')
      .eq('id', subscription.user_id)
      .single();

    const failureCount = (profile?.billing_failures || 0) + 1;
    
    await supabase
      .from('profiles')
      .update({ 
        billing_failures: failureCount,
        has_active_subscription: failureCount < 3, // Deactivate after 3 failures
      })
      .eq('id', subscription.user_id);

    // Update subscription status if too many failures
    if (failureCount >= 3) {
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);
    }
  }
}

async function handleSubscriptionDisable(supabase: any, data: any) {
  console.log('Handling subscription disable:', data);
  
  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('paystack_subscription_code', data.subscription_code);

  if (error) {
    console.error('Error updating subscription on disable:', error);
    return;
  }

  // Find and update user profile
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('paystack_subscription_code', data.subscription_code)
    .single();

  if (subscription) {
    await supabase
      .from('profiles')
      .update({ 
        has_active_subscription: false,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);
  }
}