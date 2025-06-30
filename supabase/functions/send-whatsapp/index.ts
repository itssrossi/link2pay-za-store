
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
  messageType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, clientName, amount, invoiceId, messageType }: WhatsAppRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform Zoko settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('zoko_api_key, zoko_business_phone')
      .single();

    if (settingsError || !settings?.zoko_api_key) {
      console.error('Error fetching platform Zoko settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Platform Zoko API not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for Zoko (remove + if present)
    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    let messagePayload;

    // Check if this is a payment confirmation message
    if (messageType === 'payment_confirmation') {
      // Payment confirmation message
      messagePayload = {
        channel: "whatsapp",
        recipient: formattedPhone,
        type: "text",
        message: `Hi ${clientName}, thank you for your payment! Your invoice #${invoiceId} is now marked as paid. We appreciate your business.`
      };

      console.log('Sending WhatsApp payment confirmation using platform credentials:', {
        phone: formattedPhone,
        clientName,
        invoiceId,
        messageType: 'payment_confirmation'
      });
    } else {
      // Regular invoice notification - use simpler format to avoid template restrictions
      const invoiceLink = `${req.headers.get('origin') || 'https://link2pay-za-store.lovable.app'}/invoice/${invoiceId}`;
      
      messagePayload = {
        channel: "whatsapp",
        recipient: formattedPhone,
        type: "text",
        message: `Hello ${clientName}! You have a new invoice for ${amount}. Please view and pay here: ${invoiceLink}. Thank you!`
      };

      console.log('Sending WhatsApp invoice notification using platform credentials:', {
        phone: formattedPhone,
        clientName,
        amount,
        invoiceId
      });
    }

    // Call Zoko API using platform credentials
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
      
      // Handle specific Zoko errors more gracefully
      let errorMessage = responseData.message || `HTTP ${zokoResponse.status}: ${zokoResponse.statusText}`;
      
      if (responseData.message && responseData.message.includes('template message')) {
        errorMessage = 'This appears to be a new customer. WhatsApp Business API requires approved template messages for first contact. Please contact the customer directly first, or use a different communication method.';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageTypeLabel = messageType === 'payment_confirmation' ? 'payment confirmation' : 'invoice notification';
    console.log(`WhatsApp ${messageTypeLabel} sent successfully using platform credentials:`, responseData);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `WhatsApp ${messageTypeLabel} sent successfully`
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
