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
    console.log('PayFast IPN/ITN notification received');
    
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
      billing_date,
      item_name,
      item_description,
      pf_subscription_id
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

    // Prepare update data with PayFast IPN fields
    const updateData = {
      pf_subscription_id: ipnData.subscription_id || ipnData.pf_subscription_id || null,
      payfast_billing_token: ipnData.token || null,
      subscription_amount: ipnData.amount_gross ? parseFloat(ipnData.amount_gross) : null,
      billing_start_date: ipnData.billing_date ? new Date(ipnData.billing_date).toISOString() : null,
      last_payment_id: ipnData.m_payment_id || null,
      email: ipnData.email_address || null,
      payment_status: ipnData.payment_status || null,
      item_name: ipnData.item_name || null,
      item_description: ipnData.item_description || null
    };

    // Add subscription status updates if payment is complete
    if (payment_status === 'COMPLETE') {
      console.log('Updating user subscription status to active for user:', userId);
      
      updateData.subscription_status = 'active';
      updateData.has_active_subscription = true;
      updateData.trial_expired = false;
    }

    console.log('Update data being applied:', updateData);

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('Error updating profile with IPN data:', updateError);
      return new Response('Profile update failed', { 
        status: 500,
        headers: corsHeaders
      });
    } else {
      console.log('Profile updated with IPN data:', updatedProfile);
    }

    console.log('Profile update result:', updatedProfile);
    console.log('Number of rows updated:', updatedProfile?.length || 0);

    if (!updatedProfile || updatedProfile.length === 0) {
      console.error('No rows were updated - user ID may not exist:', userId);
      return new Response('No rows updated', { 
        status: 500,
        headers: corsHeaders
      });
    }

    // Log the updated profile
    console.log('User profile after update:', {
      id: updatedProfile[0].id,
      has_active_subscription: updatedProfile[0].has_active_subscription,
      subscription_status: updatedProfile[0].subscription_status,
      trial_expired: updatedProfile[0].trial_expired,
      payfast_billing_token: updatedProfile[0].payfast_billing_token,
      pf_subscription_id: updatedProfile[0].pf_subscription_id
    });

    // Insert subscription record for tracking
    const { data: subResult, error: subError } = await supabase
      .from('payfast_subscriptions')
      .insert({
        user_id: userId,
        email: email_address,
        invoice_id: m_payment_id,
        pf_subscription_id: subscription_id || pf_subscription_id || m_payment_id,
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

    console.log('PayFast IPN/ITN processed successfully');
    
    return new Response('OK', {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('PayFast IPN/ITN error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});