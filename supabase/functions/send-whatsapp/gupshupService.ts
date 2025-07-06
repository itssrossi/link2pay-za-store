
import type { MessagePayload, GupshupSettings } from './types.ts';
import { corsHeaders } from './utils.ts';

export async function sendGupshupMessage(
  messagePayload: MessagePayload,
  settings: GupshupSettings
): Promise<Response> {
  console.log('=== Gupshup Template API Call ===');
  console.log('Message payload:', JSON.stringify(messagePayload, null, 2));
  console.log('Settings check:', { 
    hasApiKey: !!settings.gupshup_api_key, 
    apiKeyPrefix: settings.gupshup_api_key?.substring(0, 10) + '...',
    sourcePhone: settings.gupshup_source_phone 
  });
  
  // Convert payload to Gupshup template format
  const template = {
    id: messagePayload.templateId,
    params: messagePayload.templateArgs || []
  };
  
  const formData = new URLSearchParams();
  formData.append('channel', 'whatsapp');
  formData.append('source', settings.gupshup_source_phone);
  formData.append('destination', messagePayload.recipient);
  formData.append('src.name', 'Link2pay');
  formData.append('template', JSON.stringify(template));
  
  console.log('Gupshup template form data:', Object.fromEntries(formData.entries()));
  
  try {
    const gupshupResponse = await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
      method: 'POST',
      headers: {
        'apikey': settings.gupshup_api_key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const responseText = await gupshupResponse.text();
    
    console.log('Gupshup template API response:', {
      status: gupshupResponse.status,
      statusText: gupshupResponse.statusText,
      ok: gupshupResponse.ok,
      headers: Object.fromEntries(gupshupResponse.headers.entries()),
      body: responseText.substring(0, 1000)
    });
    
    return new Response(responseText, {
      status: gupshupResponse.status,
      headers: gupshupResponse.headers
    });
  } catch (error) {
    console.error('❌ Gupshup template API network error:', error);
    throw error;
  }
}

export async function sendDirectTextMessage(
  messagePayload: MessagePayload,
  settings: GupshupSettings
): Promise<Response> {
  console.log('=== Gupshup Direct Text API Call ===');
  console.log('Direct text payload:', JSON.stringify(messagePayload, null, 2));
  
  const formData = new URLSearchParams();
  formData.append('source', settings.gupshup_source_phone);
  formData.append('destination', messagePayload.recipient);
  formData.append('message', messagePayload.message || '');
  
  console.log('Gupshup direct text form data:', Object.fromEntries(formData.entries()));
  
  try {
    const gupshupResponse = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'apikey': settings.gupshup_api_key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const responseText = await gupshupResponse.text();
    
    console.log('Gupshup direct text API response:', {
      status: gupshupResponse.status,
      statusText: gupshupResponse.statusText,
      ok: gupshupResponse.ok,
      headers: Object.fromEntries(gupshupResponse.headers.entries()),
      body: responseText.substring(0, 1000)
    });
    
    return new Response(responseText, {
      status: gupshupResponse.status,
      headers: gupshupResponse.headers
    });
  } catch (error) {
    console.error('❌ Gupshup direct text API network error:', error);
    throw error;
  }
}

export async function handleGupshupResponse(
  gupshupResponse: Response,
  messageType: string
): Promise<Response> {
  const responseText = await gupshupResponse.text();
  let responseData;
  
  try {
    responseData = JSON.parse(responseText);
    console.log('✅ Parsed Gupshup response:', responseData);
  } catch (parseError) {
    console.error('❌ Failed to parse Gupshup response as JSON:', responseText);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Gupshup API returned invalid response: ${responseText.substring(0, 200)}...`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!gupshupResponse.ok) {
    console.error('❌ Gupshup API error response:', responseData);
    return new Response(
      JSON.stringify({
        success: false,
        error: responseData.message || `HTTP ${gupshupResponse.status}: ${gupshupResponse.statusText}`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const messageTypeLabel = messageType === 'payment_confirmation' ? 'payment confirmation' : 'invoice notification';
  console.log(`✅ WhatsApp ${messageTypeLabel} sent successfully:`, responseData);
  
  return new Response(
    JSON.stringify({
      success: true,
      message: `WhatsApp ${messageTypeLabel} sent successfully`,
      data: responseData
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export async function sendFallbackMessage(
  fallbackPayload: MessagePayload,
  settings: GupshupSettings
): Promise<Response> {
  console.log('=== Sending Fallback Message ===');
  console.log('Fallback payload:', fallbackPayload);
  
  return await sendDirectTextMessage(fallbackPayload, settings);
}
