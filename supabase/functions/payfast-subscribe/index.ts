
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

// Proper MD5 implementation for Deno (PayFast requires MD5 signatures)
function md5(str: string): string {
  // MD5 constants
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];

  const K = [0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
             0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
             0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
             0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
             0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
             0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
             0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
             0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391];

  function add(x: number, y: number): number {
    return (x + y) & 0xffffffff;
  }

  function leftrotate(value: number, amount: number): number {
    return (value << amount) | (value >>> (32 - amount));
  }

  // Convert string to bytes
  const msg = new TextEncoder().encode(str);
  const msgLen = msg.length;
  
  // Pre-processing: adding padding bits
  const paddedMsg = new Uint8Array(msgLen + 9 + (64 - ((msgLen + 9) % 64)) % 64);
  paddedMsg.set(msg);
  paddedMsg[msgLen] = 0x80;
  
  // Append length in bits as 64-bit little-endian
  const bitLen = msgLen * 8;
  for (let i = 0; i < 8; i++) {
    paddedMsg[paddedMsg.length - 8 + i] = (bitLen >>> (i * 8)) & 0xff;
  }

  // Initialize MD5 buffer
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  // Process message in 512-bit chunks
  for (let chunk = 0; chunk < paddedMsg.length; chunk += 64) {
    const w = new Array(16);
    for (let i = 0; i < 16; i++) {
      w[i] = paddedMsg[chunk + i * 4] |
             (paddedMsg[chunk + i * 4 + 1] << 8) |
             (paddedMsg[chunk + i * 4 + 2] << 16) |
             (paddedMsg[chunk + i * 4 + 3] << 24);
    }

    let a = h0, b = h1, c = h2, d = h3;

    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      b = add(b, leftrotate(add(add(a, f), add(K[i], w[g])), s[i]));
      a = temp;
    }

    h0 = add(h0, a);
    h1 = add(h1, b);
    h2 = add(h2, c);
    h3 = add(h3, d);
  }

  // Produce final hash value as hex string
  const hash = new Uint8Array(16);
  [h0, h1, h2, h3].forEach((h, i) => {
    hash[i * 4] = h & 0xff;
    hash[i * 4 + 1] = (h >>> 8) & 0xff;
    hash[i * 4 + 2] = (h >>> 16) & 0xff;
    hash[i * 4 + 3] = (h >>> 24) & 0xff;
  });

  return Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
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

    // PayFast subscription setup - using LIVE credentials
    const useSandbox = false;
    const merchantId = useSandbox ? "10040152" : "18305104";
    const merchantKey = useSandbox ? "6ncn7sof6argd" : "kse495ugy7ekz";
    const passphrase = useSandbox ? "johnrosspersonal" : "Bonbon123123";

    console.log("PayFast credentials check - Merchant ID:", merchantId);
    console.log("Final subscription price:", subscriptionPrice);
    console.log(useSandbox ? "Using SANDBOX PayFast environment" : "Using LIVE PayFast environment");

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


    // Clean and validate fields for PayFast requirements
    const cleanName = billingDetails.name.replace(/[^a-zA-Z\s\-]/g, '').trim();
    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingDetails.email)) {
      throw new Error("Invalid email format");
    }

    // Set billing date 7 days from now for trial setup (YYYY-MM-DD format)
    const billingDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log("Cleaned firstName:", firstName);
    console.log("Cleaned lastName:", lastName);
    console.log("Billing date:", billingDate);

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
        amount: "0.00", // Free trial - no initial payment required
        item_name: "Link2Pay Trial Setup",
        item_description: "7-day free trial setup for Link2Pay subscription service",
        subscription_type: "1", // 1 = Subscription (NOT 2 = Tokenization)
        billing_date: billingDate, // 7 days from now
        recurring_amount: subscriptionPrice.toFixed(2), // Keep in ZAR format for form submission
        frequency: "3", // Monthly (3 = Monthly in PayFast)
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
        amount: subscriptionPrice.toFixed(2), // Keep in ZAR format
        item_name: "Link2Pay Monthly Subscription",
      };
    }

    console.log("PayFast data before signature:", payfastData);
    console.log("Raw PayFast data structure:");
    console.log("- merchant_id:", payfastData.merchant_id);
    console.log("- merchant_key:", payfastData.merchant_key);
    console.log("- amount:", payfastData.amount);
    console.log("- recurring_amount:", payfastData.recurring_amount);
    console.log("- frequency:", payfastData.frequency);
    console.log("- subscription_type:", payfastData.subscription_type);
    console.log("- billing_date:", payfastData.billing_date);

    // Generate signature for PayFast (no URL encoding for signature generation)
    const createSignature = (data: any, passphrase: string) => {
      let pfOutput = "";
      
      // Create a copy of data without merchant_key for signature generation
      const signatureData = { ...data };
      delete signatureData.merchant_key; // PayFast doesn't include merchant_key in signature
      
      // Sort parameters alphabetically and build query string
      const sortedKeys = Object.keys(signatureData).sort();
      for (const key of sortedKeys) {
        if (signatureData[key] !== "" && signatureData[key] !== null && signatureData[key] !== undefined) {
          pfOutput += `${key}=${signatureData[key].toString().trim()}&`;
        }
      }
      
      // Remove last ampersand
      pfOutput = pfOutput.slice(0, -1);
      
      if (passphrase !== "") {
        pfOutput += `&passphrase=${passphrase.trim()}`;
      }
      
      console.log("Signature string (without merchant_key):", pfOutput);
      
      // Generate MD5 hash
      return md5(pfOutput);
    };

    const signature = createSignature(payfastData, passphrase);
    console.log("Generated signature:", signature);
    
    // Include merchant_key in form data (PayFast requires it)
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
      payfastUrl: useSandbox ? "https://sandbox.payfast.co.za/eng/process" : "https://www.payfast.co.za/eng/process",
      formData: formData,
      success: true,
      isTrialSetup: isTrialSetup
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in payfast-subscribe:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      errorName: error.name,
      details: "Check edge function logs for more information"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
