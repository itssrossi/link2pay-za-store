
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

    const { promoCode, billingDetails }: SubscriptionRequest = await req.json();

    console.log("Processing subscription for user:", user.id);
    console.log("Promo code:", promoCode);

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
          // Developer account - bypass everything
          isDevAccount = true;
          console.log("Developer account detected - bypassing PayFast");
        }
      }
    }

    // Handle developer account
    if (isDevAccount) {
      // Create Supabase service client for admin operations
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      // Update profile to mark as dev account with permanent subscription
      await supabaseService
        .from('profiles')
        .update({
          has_active_subscription: true,
          subscription_price: 0,
          discount_applied: true,
          trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          billing_start_date: new Date().toISOString()
        })
        .eq('id', user.id);

      // Create a dev account transaction record
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

    // Regular PayFast subscription setup (for both regular and BETA50 discount)
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

    const billingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payfastData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${req.headers.get("origin")}/dashboard?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?subscription=cancelled`,
      notify_url: "https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/payfast-notify",
      name_first: firstName,
      name_last: lastName,
      email_address: billingDetails.email,
      m_payment_id: user.id,
      amount: "5.00", // Small tokenization amount
      item_name: "Link2Pay Subscription Setup",
      subscription_type: "2", // Ad hoc subscription
      billing_date: billingDate,
      recurring_amount: subscriptionPrice.toFixed(2),
      frequency: "3", // Monthly
      cycles: "0", // Unlimited
    };

    console.log("PayFast data before signature:", payfastData);

    // Generate signature using PayFast's exact algorithm
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
      
      return crypto.subtle.digest("MD5", new TextEncoder().encode(pfOutput))
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    };

    const signature = await createSignature(payfastData, passphrase);
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
        billing_start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', user.id);

    return new Response(JSON.stringify({ 
      payfastUrl: "https://www.payfast.co.za/eng/process", // LIVE PayFast URL
      formData: formData,
      success: true
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
