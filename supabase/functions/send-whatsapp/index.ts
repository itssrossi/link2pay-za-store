
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  phone: string;
  clientName: string;
  amount: string;
  invoiceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, clientName, amount, invoiceId }: WhatsAppRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('zoko_api_key, zoko_business_phone, zoko_base_url')
      .single();

    if (settingsError || !settings?.zoko_api_key) {
      console.error('Error fetching Zoko settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Zoko API not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct invoice link
    const invoiceLink = `${req.headers.get('origin') || 'https://link2pay-za-store.lovable.app'}/invoice/${invoiceId}`;
    
    // Prepare Zoko API payload
    const messagePayload = {
      phone: phone,
      template_name: 'invoice_notification',
      params: {
        name: clientName,
        amount: amount,
        link: invoiceLink
      }
    };

    console.log('Sending WhatsApp message via Zoko:', {
      phone: phone,
      template: 'invoice_notification',
      clientName,
      amount
    });

    // Call Zoko API
    const zokoResponse = await fetch(settings.zoko_base_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.zoko_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload)
    });

    const responseData = await zokoResponse.json();

    if (!zokoResponse.ok) {
      console.error('Zoko API error:', responseData);
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || `HTTP ${zokoResponse.status}: ${zokoResponse.statusText}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WhatsApp message sent successfully via Zoko');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp message sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
