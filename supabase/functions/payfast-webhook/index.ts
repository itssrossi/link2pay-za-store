import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYFAST_PASSPHRASE = 'Bonbon123123'; // You can move this to secrets later

const validateSignature = (data: any) => {
  const sorted = Object.keys(data)
    .filter((key) => key !== 'signature')
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('&');

  const fullString = `${sorted}&passphrase=${PAYFAST_PASSPHRASE}`;

  const encoder = new TextEncoder();
  const hashBuffer = crypto.subtle.digest('MD5', encoder.encode(fullString));
  
  return hashBuffer.then(buffer => {
    const hashArray = Array.from(new Uint8Array(buffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === data.signature;
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PayFast webhook received');
    
    const ipnData = await req.json();
    console.log('IPN Data:', ipnData);

    // Validate signature
    const isValid = await validateSignature(ipnData);
    if (!isValid) {
      console.error('Invalid PayFast signature');
      return new Response('Invalid signature', { 
        status: 400,
        headers: corsHeaders
      });
    }

    const {
      m_payment_id,
      payment_status,
      subscription_id,
      amount_gross,
      email_address,
      token,
      billing_date
    } = ipnData;

    console.log('Processing payment for:', email_address, 'Status:', payment_status);

    // Find user by email - need to get from auth.users since profiles doesn't have email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return new Response('Auth error', { 
        status: 500,
        headers: corsHeaders
      });
    }
    
    const authUser = authUsers.users.find(u => u.email === email_address);
    if (!authUser) {
      console.error('User not found with email:', email_address);
      return new Response('User not found', { 
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response('User not found', { 
        status: 404,
        headers: corsHeaders
      });
    }

    // Update user subscription status
    if (payment_status === 'COMPLETE') {
      console.log('Updating user subscription status to active');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          pf_subscription_id: subscription_id,
          payfast_billing_token: token, // Store the billing token for future cancellations
          subscription_amount: parseFloat(amount_gross),
          has_active_subscription: true,
          trial_expired: false,
          billing_start_date: billing_date ? new Date(billing_date).toISOString() : new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
      }
    }

    // Insert subscription record
    const { error: subError } = await supabase
      .from('payfast_subscriptions')
      .insert({
        user_id: user.id,
        email: email_address,
        invoice_id: m_payment_id,
        pf_subscription_id: subscription_id,
        status: payment_status,
        amount: parseFloat(amount_gross),
        raw_data: ipnData
      });

    if (subError) {
      console.error('Error inserting subscription:', subError);
    }

    console.log('PayFast webhook processed successfully');
    
    return new Response('OK', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('PayFast webhook error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});