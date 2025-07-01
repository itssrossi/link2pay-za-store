
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import type { WhatsAppRequest } from './types.ts';
import { corsHeaders, formatPhoneNumber, generateInvoiceUrl } from './utils.ts';
import {
  createPaymentConfirmationPayload,
  createInvoiceNotificationPayload,
  createFallbackTextPayload
} from './messageTemplates.ts';
import {
  sendZokoMessage,
  handleZokoResponse,
  sendFallbackMessage
} from './zokoService.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, clientName, amount, invoiceId, messageType, invoiceUrl }: WhatsAppRequest = await req.json();

    console.log('WhatsApp request received:', {
      phone,
      clientName,
      amount,
      invoiceId,
      messageType: messageType || 'invoice_notification',
      invoiceUrl
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

    // Format phone number for Zoko
    const formattedPhone = formatPhoneNumber(phone);
    
    let messagePayload;

    // Create appropriate message payload based on type
    if (messageType === 'payment_confirmation') {
      console.log('Preparing payment confirmation template for:', {
        phone: formattedPhone,
        clientName,
        invoiceId
      });

      messagePayload = createPaymentConfirmationPayload(formattedPhone, clientName, invoiceId);
      console.log('Using invoice_paid template with payload:', messagePayload);
    } else {
      const finalInvoiceUrl = generateInvoiceUrl(invoiceId, invoiceUrl);
      
      console.log('Preparing invoice notification template for:', {
        phone: formattedPhone,
        clientName,
        amount,
        invoiceId,
        invoiceUrl: finalInvoiceUrl
      });

      messagePayload = createInvoiceNotificationPayload(formattedPhone, clientName, finalInvoiceUrl, amount);
      console.log('Using invoice_notification template with payload:', messagePayload);
    }

    // Send message via Zoko
    const zokoResponse = await sendZokoMessage(messagePayload, settings);
    
    // Handle successful response
    if (zokoResponse.ok) {
      return await handleZokoResponse(zokoResponse, messageType || 'invoice_notification');
    }

    // Handle failed response - try fallback if template error
    const responseText = await zokoResponse.text();
    const isTemplateError = responseText.includes('template') || responseText.includes('Template');
    
    if (isTemplateError) {
      console.log('Template error detected, trying fallback text message...');
      
      const fallbackPayload = createFallbackTextPayload(
        formattedPhone,
        clientName,
        messageType || 'invoice_notification',
        invoiceId,
        amount,
        messageType !== 'payment_confirmation' ? generateInvoiceUrl(invoiceId, invoiceUrl) : undefined
      );

      return await sendFallbackMessage(fallbackPayload, settings);
    }

    // Return error if not a template issue
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorData.message || `HTTP ${zokoResponse.status}: Failed to send message`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
