
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

    // Check promo code if provided
    let subscriptionPrice = 95.00;
    let discountApplied = false;

    if (promoCode) {
      const { data: promoData } = await supabaseClient
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promoData && promoData.code === 'BETA50') {
        subscriptionPrice = 50.00;
        discountApplied = true;
      }
    }

    // Create PayFast tokenization request
    const merchantId = "18305104";
    const merchantKey = "kse495ugy7ekz";
    const passphrase = Deno.env.get("PAYFAST_SECRET_KEY") || "";

    const payfastData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${req.headers.get("origin")}/dashboard?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?subscription=cancelled`,
      notify_url: "https://link2pay.co.za/api/payfast/itn",
      name_first: billingDetails.name.split(' ')[0],
      name_last: billingDetails.name.split(' ').slice(1).join(' ') || billingDetails.name.split(' ')[0],
      email_address: billingDetails.email,
      m_payment_id: user.id,
      amount: "5.00", // Small tokenization amount
      item_name: "Link2Pay Subscription Setup",
      subscription_type: "2", // Ad hoc subscription
      billing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      recurring_amount: subscriptionPrice.toFixed(2),
      frequency: "3", // Monthly
      cycles: "0", // Unlimited
    };

    // Generate signature
    const createSignature = (data: any, passphrase: string) => {
      const crypto = globalThis.crypto;
      let pfOutput = "";
      
      for (const key in data) {
        if (data[key] !== "") {
          pfOutput += `${key}=${encodeURIComponent(data[key].toString().trim()).replace(/%20/g, "+")}&`;
        }
      }
      
      // Remove last ampersand
      pfOutput = pfOutput.slice(0, -1);
      
      if (passphrase !== "") {
        pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
      }
      
      return crypto.subtle.digest("SHA-1", new TextEncoder().encode(pfOutput))
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        });
    };

    const signature = await createSignature(payfastData, passphrase);
    
    const formData = {
      ...payfastData,
      signature: signature
    };

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
      payfastUrl: "https://www.payfast.co.za/eng/process",
      formData: formData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in payfast-subscribe:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
