
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
  sendFallbackMessage,
  sendDirectTextMessage
} from './gupshupService.ts';

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
      .select('gupshup_api_key, gupshup_source_phone')
      .single();

    console.log('Platform settings result:', { 
      hasSettings: !!settings, 
      hasApiKey: !!settings?.gupshup_api_key,
      hasSourcePhone: !!settings?.gupshup_source_phone,
      apiKeyLength: settings?.gupshup_api_key?.length || 0,
      sourcePhone: settings?.gupshup_source_phone,
      error: settingsError 
    });

    if (settingsError || !settings?.gupshup_api_key) {
      console.error('Gupshup configuration error:', settingsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'WhatsApp service not configured. Please check Gupshup API settings.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number for Gupshup
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Phone number formatting:', { 
      original: phone, 
      formatted: formattedPhone,
      isValid: /^\+[1-9]\d{1,14}$/.test(formattedPhone)
    });
    
    let messagePayload;
    let templateAttempted = false;

    // Create appropriate message payload based on type
    if (messageType === 'payment_confirmation') {
      console.log('=== Preparing Payment Confirmation ===');
      console.log('Payment confirmation details:', {
        phone: formattedPhone,
        clientName,
        invoiceId
      });

      messagePayload = createPaymentConfirmationPayload(formattedPhone, clientName, invoiceId);
      templateAttempted = true;
      console.log('Payment confirmation template payload:', JSON.stringify(messagePayload, null, 2));
    } else {
      const finalInvoiceUrl = generateInvoiceUrl(invoiceId, invoiceUrl);
      
      console.log('=== Preparing Invoice Notification ===');
      console.log('Invoice notification details:', {
        phone: formattedPhone,
        clientName,
        amount,
        invoiceId,
        invoiceUrl: finalInvoiceUrl
      });

      messagePayload = createInvoiceNotificationPayload(formattedPhone, clientName, finalInvoiceUrl, amount);
      templateAttempted = true;
      console.log('Invoice notification template payload:', JSON.stringify(messagePayload, null, 2));
    }

    // Attempt to send template message first
    console.log('=== Attempting Template Message ===');
    try {
      const gupshupResponse = await sendGupshupMessage(messagePayload, settings);
      
      console.log('Template message response status:', gupshupResponse.status);
      console.log('Template message response ok:', gupshupResponse.ok);
      
      if (gupshupResponse.ok) {
        console.log('✅ Template message sent successfully');
        return await handleGupshupResponse(gupshupResponse, messageType || 'invoice_notification');
      }

      // If template fails, log the error and try fallback
      const responseText = await gupshupResponse.text();
      console.error('❌ Template message failed:', {
        status: gupshupResponse.status,
        statusText: gupshupResponse.statusText,
        responseBody: responseText.substring(0, 500)
      });

      // Check if it's a template-related error
      const isTemplateError = responseText.toLowerCase().includes('template') || 
                             responseText.toLowerCase().includes('not found') ||
                             responseText.toLowerCase().includes('invalid') ||
                             gupshupResponse.status === 400;

      if (isTemplateError) {
        console.log('=== Template Error Detected - Trying Fallback ===');
        
        // Try direct text message as fallback
        const fallbackPayload = createFallbackTextPayload(
          formattedPhone,
          clientName,
          messageType || 'invoice_notification',
          invoiceId,
          amount,
          messageType !== 'payment_confirmation' ? generateInvoiceUrl(invoiceId, invoiceUrl) : undefined
        );

        console.log('Fallback text message payload:', JSON.stringify(fallbackPayload, null, 2));
        
        try {
          const fallbackResponse = await sendDirectTextMessage(fallbackPayload, settings);
          console.log('Fallback message response status:', fallbackResponse.status);
          
          if (fallbackResponse.ok) {
            console.log('✅ Fallback text message sent successfully');
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Message sent via text (template not available)',
                data: { fallback: true, method: 'direct_text' }
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const fallbackText = await fallbackResponse.text();
          console.error('❌ Fallback message also failed:', fallbackText);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Both template and fallback failed. Template error: ${responseText.substring(0, 200)}. Fallback error: ${fallbackText.substring(0, 200)}`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (fallbackError) {
          console.error('❌ Error sending fallback message:', fallbackError);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Template failed and fallback errored: ${fallbackError.message}`
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Return original template error if not template-related
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorData.message || `HTTP ${gupshupResponse.status}: ${gupshupResponse.statusText}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (networkError) {
      console.error('❌ Network error sending template message:', networkError);
      
      // Try direct fallback on network error
      console.log('=== Network Error - Trying Direct Fallback ===');
      
      try {
        const fallbackPayload = createFallbackTextPayload(
          formattedPhone,
          clientName,
          messageType || 'invoice_notification',
          invoiceId,
          amount,
          messageType !== 'payment_confirmation' ? generateInvoiceUrl(invoiceId, invoiceUrl) : undefined
        );

        const fallbackResponse = await sendDirectTextMessage(fallbackPayload, settings);
        
        if (fallbackResponse.ok) {
          console.log('✅ Network fallback successful');
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Message sent via fallback due to network issue',
              data: { fallback: true, method: 'network_fallback' }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fallbackNetworkError) {
        console.error('❌ Network fallback also failed:', fallbackNetworkError);
      }

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
