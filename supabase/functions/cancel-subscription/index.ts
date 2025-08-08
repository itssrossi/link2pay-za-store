
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get user's billing token or subscription ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('payfast_billing_token, pf_subscription_id')
      .eq('id', user.id)
      .single();

    // Check if user has either billing token or subscription ID
    const billingToken = profile?.payfast_billing_token;
    const subscriptionId = profile?.pf_subscription_id;
    
    if (!billingToken && !subscriptionId) {
      throw new Error("No active subscription found");
    }

    // Call PayFast API to cancel subscription
    const merchantId = "18305104";
    const merchantKey = "kse495ugy7ekz";
    const passphrase = "Bonbon123123";

    // Use billing token if available, otherwise use subscription ID
    const cancelData = billingToken ? {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      token: billingToken,
      passphrase: passphrase
    } : {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      subscription_id: subscriptionId,
      passphrase: passphrase
    };

    // Generate signature for cancellation
    const createSignature = (data: any) => {
      const crypto = globalThis.crypto;
      
      const keys = Object.keys(data).sort();
      let pfOutput = "";
      for (const key of keys) {
        if (data[key] !== "") {
          pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
        }
      }
      pfOutput = pfOutput.slice(0, -1);

      
      return crypto.subtle.digest("SHA-1", new TextEncoder().encode(pfOutput))
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    };

    const signature = await createSignature(cancelData);

    // Make request to PayFast to cancel subscription
    const cancelUrl = billingToken 
      ? "https://api.payfast.co.za/subscriptions/cancel"
      : "https://api.payfast.co.za/subscriptions/cancel";
      
    const response = await fetch(cancelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        ...cancelData,
        signature: signature
      }),
    });

    if (response.ok) {
      // Update user profile
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseService
        .from('profiles')
        .update({
          has_active_subscription: false,
          cancelled_at: new Date().toISOString(),
          payfast_billing_token: null,
          trial_expired: true,
          subscription_status: 'cancelled'
        })
        .eq('id', user.id);

      // Record cancellation transaction
      await supabaseService
        .from('subscription_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'cancellation',
          status: 'completed',
          reference: 'Subscription cancelled by user'
        });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      throw new Error("Failed to cancel subscription with PayFast");
    }

  } catch (error) {
    console.error("Error in cancel-subscription:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
