
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
      .select('zoko_api_key')
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
    
    // Format phone number for Zoko (remove + if present)
    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    // Prepare Zoko API payload according to their documentation
    const messagePayload = {
      channel: "whatsapp",
      recipient: formattedPhone,
      type: "template",
      message: `Hi ${clientName}! Your invoice for ${amount} is ready. Please click the link to view and pay: ${invoiceLink}`
    };

    console.log('Sending WhatsApp message via Zoko:', {
      phone: formattedPhone,
      clientName,
      amount,
      invoiceId
    });

    // Call Zoko API with correct endpoint and authentication
    const zokoResponse = await fetch('https://chat.zoko.io/v2/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.zoko_api_key
      },
      body: JSON.stringify(messagePayload)
    });

    let responseData;
    const responseText = await zokoResponse.text();
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Zoko response as JSON:', responseText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Zoko API returned invalid response: ${responseText.substring(0, 200)}...`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('WhatsApp message sent successfully via Zoko:', responseData);
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
