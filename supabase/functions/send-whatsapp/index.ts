
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import type { WhatsAppRequest } from './types.ts';
import { corsHeaders, generateInvoiceUrl } from './utils.ts';
import {
  createPaymentConfirmationPayload,
  createInvoiceNotificationPayload,
  createFallbackTextPayload
} from './messageTemplates.ts';
import {
  sendTwilioMessage,
  handleTwilioResponse
} from './twilioService.ts';

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, clientName, amount, invoiceId, messageType, invoiceUrl }: WhatsAppRequest = await req.json();

    console.log('=== WhatsApp Message Request Started ===');
    console.log('Request payload:', {
      phone,
      clientName,
      amount,
      invoiceId,
      messageType: messageType || 'invoice_notification',
      invoiceUrl,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!phone || !clientName || !invoiceId) {
      const missingFields = [];
      if (!phone) missingFields.push('phone');
      if (!clientName) missingFields.push('clientName');
      if (!invoiceId) missingFields.push('invoiceId');
      
      console.error('Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching platform settings...');
    
    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('twilio_account_sid, twilio_auth_token, twilio_whatsapp_number')
      .single();

    console.log('Platform settings result:', { 
      hasSettings: !!settings, 
      hasAccountSid: !!settings?.twilio_account_sid,
      hasAuthToken: !!settings?.twilio_auth_token,
      whatsappNumber: settings?.twilio_whatsapp_number,
      error: settingsError 
    });

    if (settingsError || !settings?.twilio_account_sid || !settings?.twilio_auth_token) {
      console.error('Twilio configuration error:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp service not configured. Please check Twilio API settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messagePayload;
    let templateAttempted = false;

    // Create appropriate message payload based on type
    if (messageType === 'payment_confirmation') {
      console.log('=== Preparing Payment Confirmation ===');
      console.log('Payment confirmation details:', {
        phone,
        clientName,
        invoiceId
      });

      messagePayload = createPaymentConfirmationPayload(phone, clientName, invoiceId);
      templateAttempted = true;
      console.log('Payment confirmation template payload:', JSON.stringify(messagePayload, null, 2));
    } else {
      const finalInvoiceUrl = generateInvoiceUrl(invoiceId, invoiceUrl);
      
      console.log('=== Preparing Invoice Notification ===');
      console.log('Invoice notification details:', {
        phone,
        clientName,
        amount,
        invoiceId,
        invoiceUrl: finalInvoiceUrl
      });

      messagePayload = createInvoiceNotificationPayload(phone, clientName, finalInvoiceUrl, amount);
      templateAttempted = true;
      console.log('Invoice notification template payload:', JSON.stringify(messagePayload, null, 2));
    }

    // Send message via Twilio
    console.log('=== Sending Message via Twilio ===');
    try {
      const twilioResponse = await sendTwilioMessage(messagePayload, settings);
      
      console.log('Twilio message response status:', twilioResponse.status);
      console.log('Twilio message response ok:', twilioResponse.ok);
      
      return await handleTwilioResponse(twilioResponse, messageType || 'invoice_notification');

    } catch (networkError) {
      console.error('❌ Network error sending Twilio message:', networkError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Network error: ${networkError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('=== CRITICAL ERROR in send-whatsapp function ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
