
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const formData = await req.formData();
    const data: any = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    console.log("PayFast ITN received:", data);

    const userId = data.m_payment_id;
    const paymentStatus = data.payment_status;
    const token = data.token;
    const amount = parseFloat(data.amount_gross || "0");

    if (paymentStatus === "COMPLETE") {
      if (token) {
        // This is a tokenization success - store the billing token
        await supabaseClient
          .from('profiles')
          .update({
            payfast_billing_token: token,
            has_active_subscription: true
          })
          .eq('id', userId);

        // Record transaction
        await supabaseClient
          .from('subscription_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'subscription_payment',
            amount: amount,
            payfast_payment_id: data.pf_payment_id,
            status: 'completed',
            reference: 'PayFast tokenization successful'
          });
      } else {
        // This is a regular subscription payment
        await supabaseClient
          .from('profiles')
          .update({
            has_active_subscription: true,
            billing_failures: 0
          })
          .eq('id', userId);

        // Record transaction
        await supabaseClient
          .from('subscription_transactions')
          .insert({
            user_id: userId,
            transaction_type: 'subscription_payment',
            amount: amount,
            payfast_payment_id: data.pf_payment_id,
            status: 'completed',
            reference: 'Link2Pay Monthly Subscription'
          });
      }
    } else {
      // Payment failed - increment failure count
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('billing_failures')
        .eq('id', userId)
        .single();

      const failures = (profile?.billing_failures || 0) + 1;
      
      await supabaseClient
        .from('profiles')
        .update({
          billing_failures: failures,
          has_active_subscription: failures < 3 // Disable after 3 failures
        })
        .eq('id', userId);

      // Record failed transaction
      await supabaseClient
        .from('subscription_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'subscription_payment',
          amount: amount,
          payfast_payment_id: data.pf_payment_id,
          status: 'failed',
          reference: 'Link2Pay Monthly Subscription - Failed'
        });
    }

    return new Response("OK", {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("Error in payfast-notify:", error);
    return new Response("Error", {
      headers: corsHeaders,
      status: 500,
    });
  }
});
