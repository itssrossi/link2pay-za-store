import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Activating subscription for user:', user.id);

    // Update user's subscription status
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        has_active_subscription: true,
        subscription_status: 'active',
        trial_expired: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw updateError;
    }

    // Create subscription transaction record
    const { error: transactionError } = await supabaseClient
      .from('subscription_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'subscription_payment',
        status: 'completed',
        reference: 'Manual activation for testing',
        amount: 5, // BETA5 amount
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't throw here as the main update succeeded
    }

    console.log('Subscription activated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription activated successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in activate-subscription:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to activate subscription' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});