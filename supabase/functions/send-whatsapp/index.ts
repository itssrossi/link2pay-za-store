
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

    console.log('WhatsApp request received:', {
      phone,
      clientName,
      amount,
      invoiceId,
      messageType: messageType || 'invoice_notification'
    });

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

    // Format phone number for Zoko (remove + if present)
    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    let messagePayload;

    // Check if this is a payment confirmation message
    if (messageType === 'payment_confirmation') {
      console.log('Preparing payment confirmation template for:', {
        phone: formattedPhone,
        clientName,
        invoiceId
      });

      // Use the invoice_paid template for payment confirmations
      messagePayload = {
        channel: "whatsapp",
        recipient: formattedPhone,
        type: "template",
        templateId: "invoice_paid",
        templateData: {
          "1": clientName,
          "2": invoiceId
        }
      };

      console.log('Using invoice_paid template with payload:', messagePayload);
    } else {
      // Regular invoice notification - use simple text message
      const invoiceLink = `${req.headers.get('origin') || 'https://link2pay-za-store.lovable.app'}/invoice/${invoiceId}`;
      
      messagePayload = {
        channel: "whatsapp",
        recipient: formattedPhone,
        type: "text",
        message: `Hi ${clientName}!\n\nYou have a new invoice for R${amount}.\n\nView and pay your invoice here: ${invoiceLink}\n\nThank you! 🙏`
      };

      console.log('Sending WhatsApp invoice notification:', {
        phone: formattedPhone,
        clientName,
        amount,
        invoiceId,
        invoiceLink
      });
    }

    // Call Zoko API
    console.log('Calling Zoko API with payload:', JSON.stringify(messagePayload, null, 2));
    
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
    
    console.log('Zoko API response status:', zokoResponse.status);
    console.log('Zoko API response text:', responseText);
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Zoko response as JSON:', responseText);
      
      // If template failed, try fallback text message for payment confirmations
      if (messageType === 'payment_confirmation' && responseText.includes('template')) {
        console.log('Template failed, trying fallback text message...');
        
        const fallbackPayload = {
          channel: "whatsapp",
          recipient: formattedPhone,
          type: "text",
          message: `Hello ${clientName},\n\nPayment received! ✅\n\nYour invoice #${invoiceId} has been marked as PAID. Thank you for your business with us.`
        };

        const fallbackResponse = await fetch('https://chat.zoko.io/v2/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.zoko_api_key
          },
          body: JSON.stringify(fallbackPayload)
        });

        const fallbackText = await fallbackResponse.text();
        console.log('Fallback response:', fallbackText);

        if (fallbackResponse.ok) {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Payment confirmation sent via fallback text message',
              data: { fallback: true }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
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
      
      // If template error for payment confirmation, try fallback
      if (messageType === 'payment_confirmation' && (responseData.message || '').toLowerCase().includes('template')) {
        console.log('Template error detected, trying fallback text message...');
        
        const fallbackPayload = {
          channel: "whatsapp",
          recipient: formattedPhone,
          type: "text",
          message: `Hello ${clientName},\n\nPayment received! ✅\n\nYour invoice #${invoiceId} has been marked as PAID. Thank you for your business with us.`
        };

        const fallbackResponse = await fetch('https://chat.zoko.io/v2/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.zoko_api_key
          },
          body: JSON.stringify(fallbackPayload)
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Payment confirmation sent via fallback text message (template not approved)',
              data: fallbackData
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: responseData.message || `HTTP ${zokoResponse.status}: ${zokoResponse.statusText}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageTypeLabel = messageType === 'payment_confirmation' ? 'payment confirmation' : 'invoice notification';
    console.log(`WhatsApp ${messageTypeLabel} sent successfully:`, responseData);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `WhatsApp ${messageTypeLabel} sent successfully`,
        data: responseData
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
