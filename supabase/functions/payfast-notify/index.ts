
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

function validatePayFastSignature(data: Record<string, string>, passphrase?: string): boolean {
  console.log('PayFast Notify: Validating signature for data:', data);
  
  // Remove signature from data for validation
  const { signature, ...dataForValidation } = data;
  
  // Filter out empty values and sort alphabetically
  const filteredData: Record<string, string> = {};
  Object.keys(dataForValidation).forEach(key => {
    const value = dataForValidation[key];
    if (value !== undefined && value !== null && value.toString().trim() !== '') {
      filteredData[key] = value.toString().trim();
    }
  });

  const sortedKeys = Object.keys(filteredData).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${filteredData[key]}`)
    .join('&');

  const finalString = passphrase && passphrase.trim() 
    ? `${queryString}&passphrase=${passphrase.trim()}`
    : queryString;

  const expectedSignature = CryptoJS.MD5(finalString).toString();
  
  console.log('PayFast Notify: Expected signature:', expectedSignature);
  console.log('PayFast Notify: Received signature:', signature);
  
  return expectedSignature === signature;
}

serve(async (req: Request) => {
  console.log('PayFast Notify: Received request', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    
    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      data[key] = value.toString();
    }

    console.log('PayFast Notify: Received data:', data);

    // Get merchant credentials from database to validate signature
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
      .eq('payfast_merchant_id', data.merchant_id)
      .single();

    if (profileError || !profileData) {
      console.error('PayFast Notify: Error finding merchant profile:', profileError);
      return new Response('Merchant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Validate signature
    const isValidSignature = validatePayFastSignature(data, profileData.payfast_passphrase);
    
    if (!isValidSignature) {
      console.error('PayFast Notify: Invalid signature');
      return new Response('Invalid signature', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Extract invoice ID from custom fields or item name
    const invoiceNumber = data.item_name?.replace('Invoice #', '') || data.custom_str1;
    
    if (!invoiceNumber) {
      console.error('PayFast Notify: No invoice number found');
      return new Response('Invoice number not found', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Update invoice status based on payment status
    let invoiceStatus = 'pending';
    if (data.payment_status === 'COMPLETE') {
      invoiceStatus = 'paid';
    } else if (data.payment_status === 'FAILED') {
      invoiceStatus = 'failed';
    }

    // Update invoice in database
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: invoiceStatus,
        updated_at: new Date().toISOString()
      })
      .eq('invoice_number', invoiceNumber);

    if (updateError) {
      console.error('PayFast Notify: Error updating invoice:', updateError);
      return new Response('Error updating invoice', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log(`PayFast Notify: Updated invoice ${invoiceNumber} to status ${invoiceStatus}`);

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('PayFast Notify: Error processing notification:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
