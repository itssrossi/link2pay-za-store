import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PAYFAST_PASSPHRASE = Deno.env.get('PAYFAST_PASSPHRASE') || 'Bonbon123123'; // Prefer secret, fallback for dev

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
    
    let ipnData: any;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      ipnData = await req.json();
    } else {
      const text = await req.text();
      try {
        const params = new URLSearchParams(text);
        ipnData = Object.fromEntries(params.entries());
      } catch (_) {
        // Fallback: attempt to parse as JSON anyway
        ipnData = JSON.parse(text);
      }
    }
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
    console.log('Payment ID format:', m_payment_id);
    console.log('Token received:', token);

    // Extract user ID from m_payment_id
    console.log('🔍 Processing m_payment_id:', m_payment_id);
    let userId = null;
    
    if (m_payment_id) {
      // Check if m_payment_id is a direct UUID (for testing)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(m_payment_id)) {
        userId = m_payment_id;
        console.log('✅ m_payment_id is direct UUID:', userId);
      } else if (m_payment_id.startsWith('sub-')) {
        const parts = m_payment_id.split('-');
        if (parts.length >= 3) {
          // Reconstruct UUID from the last parts (sub-{timestamp}-{uuid})
          userId = parts.slice(2).join('-');
          console.log('✅ Extracted user ID from sub- format:', userId);
        }
      }
    }

    // If we couldn't extract UUID from payment ID, find user by email
    if (!userId) {
      console.log('Could not extract user ID from payment ID, falling back to email lookup');
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
      userId = authUser.id;
    }

    console.log('Final user ID for processing:', userId);
    
    // Get user profile and log current state
    const { data: userBefore, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return new Response('Database error', { 
        status: 500,
        headers: corsHeaders
      });
    }

    if (!userBefore) {
      console.error('User profile not found for ID:', userId);
      return new Response('User profile not found', { 
        status: 404,
        headers: corsHeaders
      });
    }

    console.log('User profile before update:', {
      id: userBefore.id,
      has_active_subscription: userBefore.has_active_subscription,
      subscription_status: userBefore.subscription_status,
      trial_expired: userBefore.trial_expired
    });

    // Update user subscription status
    if (payment_status === 'COMPLETE') {
      console.log('Updating user subscription status to active for user:', userId);
      
      const updateData = {
        subscription_status: 'active',
        pf_subscription_id: subscription_id || m_payment_id, // Use subscription_id if available, fallback to m_payment_id
        payfast_billing_token: token,
        subscription_amount: parseFloat(amount_gross),
        has_active_subscription: true,
        trial_expired: false,
        billing_start_date: billing_date ? new Date(billing_date).toISOString() : new Date().toISOString()
      };

      console.log('Update data being applied:', updateData);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        return new Response('Profile update failed', { 
          status: 500,
          headers: corsHeaders
        });
      }

      console.log('Profile update result:', updateResult);
      console.log('Number of rows updated:', updateResult?.length || 0);

      if (!updateResult || updateResult.length === 0) {
        console.error('No rows were updated - user ID may not exist:', userId);
        return new Response('No rows updated', { 
          status: 500,
          headers: corsHeaders
        });
      }

      // Log the updated profile
      console.log('User profile after update:', {
        id: updateResult[0].id,
        has_active_subscription: updateResult[0].has_active_subscription,
        subscription_status: updateResult[0].subscription_status,
        trial_expired: updateResult[0].trial_expired,
        payfast_billing_token: updateResult[0].payfast_billing_token
      });
    }

    // Insert subscription record
    const { data: subResult, error: subError } = await supabase
      .from('payfast_subscriptions')
      .insert({
        user_id: userId,
        email: email_address,
        invoice_id: m_payment_id,
        pf_subscription_id: subscription_id || m_payment_id,
        status: payment_status,
        amount: parseFloat(amount_gross),
        raw_data: ipnData
      })
      .select();

    if (subError) {
      console.error('Error inserting subscription record:', subError);
    } else {
      console.log('Subscription record inserted:', subResult);
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