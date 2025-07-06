
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
  sendGupshupMessage,
  handleGupshupResponse,
  sendFallbackMessage
} from './gupshupService.ts';

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

    // Validate required fields
    if (!phone || !clientName || !invoiceId) {
      console.error('Missing required fields:', { phone: !!phone, clientName: !!clientName, invoiceId: !!invoiceId });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: phone, clientName, or invoiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('gupshup_api_key, gupshup_source_phone')
      .single();

    console.log('Platform settings fetch result:', { 
      hasSettings: !!settings, 
      hasApiKey: !!settings?.gupshup_api_key,
      hasSourcePhone: !!settings?.gupshup_source_phone,
      error: settingsError 
    });

    if (settingsError || !settings?.gupshup_api_key) {
      console.error('Error fetching Gupshup settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Gupshup API not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for Gupshup
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Phone formatting:', { original: phone, formatted: formattedPhone });
    
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
      console.log('Using invoice_notification template with payload:', JSON.stringify(messagePayload, null, 2));
    }

    // Send message via Gupshup
    console.log('Sending message to Gupshup...');
    const gupshupResponse = await sendGupshupMessage(messagePayload, settings);
    
    // Handle successful response
    if (gupshupResponse.ok) {
      console.log('Gupshup response successful, processing...');
      return await handleGupshupResponse(gupshupResponse, messageType || 'invoice_notification');
    }

    // Handle failed response - try fallback if template error
    const responseText = await gupshupResponse.text();
    console.error('Gupshup response failed:', {
      status: gupshupResponse.status,
      statusText: gupshupResponse.statusText,
      responseText: responseText.substring(0, 500)
    });
    
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
        error: errorData.message || `HTTP ${gupshupResponse.status}: Failed to send message`
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
