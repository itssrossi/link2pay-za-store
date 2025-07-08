import type { MessagePayload, TwilioSettings } from './types.ts';
import { corsHeaders } from './utils.ts';

export async function sendTwilioMessage(
  messagePayload: MessagePayload,
  settings: TwilioSettings
): Promise<Response> {
  console.log('=== Twilio WhatsApp API Call ===');
  console.log('Message payload:', JSON.stringify(messagePayload, null, 2));
  console.log('Settings check:', { 
    hasAccountSid: !!settings.twilio_account_sid, 
    hasAuthToken: !!settings.twilio_auth_token,
    whatsappNumber: settings.twilio_whatsapp_number 
  });
  
  // Prepare form data for Twilio API
  const formData = new URLSearchParams();
  formData.append('To', messagePayload.recipient);
  formData.append('From', settings.twilio_whatsapp_number);
  formData.append('MessagingServiceSid', messagePayload.templateId || '');
  formData.append('Body', messagePayload.message || '');
  
  console.log('Twilio form data:', Object.fromEntries(formData.entries()));
  
  try {
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      }
    );

    const responseText = await twilioResponse.text();
    
    console.log('Twilio API response:', {
      status: twilioResponse.status,
      statusText: twilioResponse.statusText,
      ok: twilioResponse.ok,
      headers: Object.fromEntries(twilioResponse.headers.entries()),
      body: responseText.substring(0, 1000)
    });
    
    return new Response(responseText, {
      status: twilioResponse.status,
      headers: twilioResponse.headers
    });
  } catch (error) {
    console.error('❌ Twilio API network error:', error);
    throw error;
  }
}

export async function handleTwilioResponse(
  twilioResponse: Response,
  messageType: string
): Promise<Response> {
  const responseText = await twilioResponse.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
    console.log('✅ Parsed Twilio response:', responseData);
  } catch (parseError) {
    console.error('❌ Failed to parse Twilio response as JSON:', responseText);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Twilio API returned invalid response: ${responseText.substring(0, 200)}...`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!twilioResponse.ok) {
    console.error('❌ Twilio API error response:', responseData);
    return new Response(
      JSON.stringify({
        success: false,
        error: responseData.message || `HTTP ${twilioResponse.status}: ${twilioResponse.statusText}`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const messageTypeLabel = messageType === 'payment_confirmation' ? 'payment confirmation' : 'invoice notification';
  console.log(`✅ WhatsApp ${messageTypeLabel} sent successfully via Twilio:`, responseData);
  
  return new Response(
    JSON.stringify({
      success: true,
      message: `WhatsApp ${messageTypeLabel} sent successfully via Twilio`,
      data: responseData
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}