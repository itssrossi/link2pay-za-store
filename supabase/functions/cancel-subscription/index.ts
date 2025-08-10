
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
    console.log("Starting subscription cancellation process...");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      console.error("User not authenticated");
      throw new Error("User not authenticated");
    }

    console.log(`Processing cancellation for user: ${user.id}`);

    // Get user's billing token
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('payfast_billing_token, pf_subscription_id, payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
      .eq('id', user.id)
      .single();

    console.log("Profile data retrieved:", { 
      hasToken: !!profile?.payfast_billing_token,
      hasSubscriptionId: !!profile?.pf_subscription_id,
      hasMerchantId: !!profile?.payfast_merchant_id
    });

    // Check if user has billing token
    const billingToken = profile?.payfast_billing_token;
    
    if (!billingToken) {
      console.error("No billing token found for user");
      throw new Error("No active subscription token found");
    }

    // Get PayFast credentials from environment or profile
    const merchantId = profile?.payfast_merchant_id || Deno.env.get("PAYFAST_MERCHANT_ID") || "18305104";
    const merchantKey = profile?.payfast_merchant_key || Deno.env.get("PAYFAST_MERCHANT_KEY") || "kse495ugy7ekz";
    const passphrase = profile?.payfast_passphrase || Deno.env.get("PAYFAST_PASSPHRASE") || "Bonbon123123";

    // Create timestamp in ISO 8601 format
    const timestamp = new Date().toISOString();
    
    // Prepare cancellation data in JSON format (PayFast API v1 format)
    const cancelData = {
      "version": "v1",
      "timestamp": timestamp,
      "passphrase": passphrase,
      "merchant-id": merchantId
    };

    console.log("Cancellation data prepared:", { 
      version: cancelData.version,
      timestamp: cancelData.timestamp,
      merchantId: cancelData["merchant-id"],
      token: billingToken
    });

    // PayFast API endpoint for cancellation
    const cancelUrl = `https://api.payfast.co.za/subscriptions/${billingToken}/cancel`;
    
    console.log(`Making PUT request to: ${cancelUrl}`);
    
    const response = await fetch(cancelUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "merchant-id": merchantId,
        "merchant-key": merchantKey,
        "timestamp": timestamp,
        "version": "v1"
      },
      body: JSON.stringify(cancelData),
    });

    console.log("PayFast response status:", response.status);
    const responseText = await response.text();
    console.log("PayFast response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse PayFast response as JSON:", responseText);
      responseData = { response: responseText };
    }

    if (response.ok && (responseData.response === true || response.status === 200)) {
      console.log("PayFast cancellation successful, updating database...");
      
      // Update user profile
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          has_active_subscription: false,
          cancelled_at: new Date().toISOString(),
          payfast_billing_token: null,
          trial_expired: true,
          subscription_status: 'cancelled'
        })
        .eq('id', user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw new Error("Failed to update subscription status");
      }

      // Record cancellation transaction
      const { error: transactionError } = await supabaseService
        .from('subscription_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'cancellation',
          status: 'completed',
          reference: 'Subscription cancelled by user',
          payfast_payment_id: billingToken
        });

      if (transactionError) {
        console.error("Error creating transaction record:", transactionError);
        // Don't throw here, cancellation was successful
      }

      console.log("Subscription cancellation completed successfully");
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription cancelled successfully",
        payfast_response: responseData 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error("PayFast cancellation failed:", {
        status: response.status,
        statusText: response.statusText,
        response: responseData
      });
      
      throw new Error(`PayFast cancellation failed: ${response.status} - ${responseData.message || responseText}`);
    }

  } catch (error) {
    console.error("Error in cancel-subscription:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Please contact support if this issue persists" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
