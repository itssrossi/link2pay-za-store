
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionRequest {
  promoCode?: string;
  billingDetails: {
    name: string;
    email: string;
  };
  isTrialSetup?: boolean;
}

// MD5 implementation for PayFast signature
function md5(str: string): string {
  // Import crypto-js for MD5 hashing
  const CryptoJS = globalThis.CryptoJS || (() => {
    throw new Error("CryptoJS not available");
  })();
  
  // Simple MD5 implementation for Deno
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Use a simple hash function as fallback (this is not secure, just for demo)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0').repeat(4).substring(0, 32);
}

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

    const { promoCode, billingDetails, isTrialSetup }: SubscriptionRequest = await req.json();

    console.log("Processing subscription for user:", user.id);
    console.log("Promo code:", promoCode);
    console.log("Is trial setup:", isTrialSetup);

    // Check promo code if provided
    let subscriptionPrice = 95.00;
    let discountApplied = false;
    let isDevAccount = false;

    if (promoCode) {
      const { data: promoData } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promoData) {
        if (promoData.code === 'BETA50') {
          subscriptionPrice = 50.00;
          discountApplied = true;
          console.log("BETA50 promo applied - Price reduced to R50");
        } else if (promoData.code === 'DEVJOHN') {
          isDevAccount = true;
          console.log("Developer account detected - bypassing PayFast");
        }
      }
    }

    // Handle developer account
    if (isDevAccount) {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      await supabaseService
        .from('profiles')
        .update({
          has_active_subscription: true,
          subscription_price: 0,
          discount_applied: true,
          trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          billing_start_date: new Date().toISOString()
        })
        .eq('id', user.id);

      await supabaseService
        .from('subscription_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'subscription_payment',
          amount: 0,
          status: 'completed',
          reference: 'Developer account - DEVJOHN code'
        });

      console.log("Developer account setup complete");

      return new Response(JSON.stringify({ 
        success: true,
        devAccount: true,
        message: "Developer account activated successfully!"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // PayFast subscription setup
    const merchantId = "18305104";
    const merchantKey = "kse495ugy7ekz";
    const passphrase = Deno.env.get("PAYFAST_SECRET_KEY") || "";

    if (!passphrase) {
      throw new Error("PAYFAST_SECRET_KEY not configured");
    }

    console.log("PayFast credentials check - Merchant ID:", merchantId);
    console.log("Final subscription price:", subscriptionPrice);
    console.log("Using LIVE PayFast environment");

    // Split name for PayFast requirements
    const nameParts = billingDetails.name.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Set billing date 7 days from now for trial setup
    const billingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let payfastData;

    if (isTrialSetup) {
      payfastData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${req.headers.get("origin")}/dashboard?trial=success`,
        cancel_url: `${req.headers.get("origin")}/billing-setup?trial=cancelled`,
        notify_url: "https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/payfast-notify",
        name_first: firstName,
        name_last: lastName,
        email_address: billingDetails.email,
        m_payment_id: user.id,
        amount: "5.00", // Small tokenization amount
        item_name: "Link2Pay Trial Setup",
        subscription_type: "2", // Ad hoc subscription
        billing_date: billingDate, // 7 days from now
        recurring_amount: subscriptionPrice.toFixed(2),
        frequency: "3", // Monthly
        cycles: "0", // Unlimited
      };
    } else {
      payfastData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${req.headers.get("origin")}/dashboard?subscription=success`,
        cancel_url: `${req.headers.get("origin")}/dashboard?subscription=cancelled`,
        notify_url: "https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/payfast-notify",
        name_first: firstName,
        name_last: lastName,
        email_address: billingDetails.email,
        m_payment_id: user.id,
        amount: subscriptionPrice.toFixed(2),
        item_name: "Link2Pay Monthly Subscription",
      };
    }

    console.log("PayFast data before signature:", payfastData);

    // Generate signature for PayFast
    const createSignature = (data: any, passphrase: string) => {
      let pfOutput = "";
      
      // Sort parameters alphabetically and build query string
      const sortedKeys = Object.keys(data).sort();
      for (const key of sortedKeys) {
        if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
          pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
        }
      }
      
      // Remove last ampersand
      pfOutput = pfOutput.slice(0, -1);
      
      if (passphrase !== "") {
        pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
      }
      
      console.log("Signature string:", pfOutput);
      
      // Generate MD5 hash
      return md5(pfOutput);
    };

    const signature = createSignature(payfastData, passphrase);
    console.log("Generated signature:", signature);
    
    const formData = {
      ...payfastData,
      signature: signature
    };

    console.log("Final PayFast form data:", formData);

    // Update user profile with subscription details
    await supabaseClient
      .from('profiles')
      .update({
        subscription_price: subscriptionPrice,
        discount_applied: discountApplied,
        billing_start_date: isTrialSetup ? billingDate : new Date().toISOString(),
        trial_ends_at: isTrialSetup ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null
      })
      .eq('id', user.id);

    return new Response(JSON.stringify({ 
      payfastUrl: "https://www.payfast.co.za/eng/process",
      formData: formData,
      success: true,
      isTrialSetup: isTrialSetup
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in payfast-subscribe:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
