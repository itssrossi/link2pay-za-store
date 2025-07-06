
import type { MessagePayload, GupshupSettings } from './types.ts';
import { corsHeaders } from './utils.ts';

export async function sendGupshupMessage(
  messagePayload: MessagePayload,
  settings: GupshupSettings
): Promise<Response> {
  console.log('Calling Gupshup API with payload:', JSON.stringify(messagePayload, null, 2));
  console.log('Using settings:', { 
    hasApiKey: !!settings.gupshup_api_key, 
    sourcePhone: settings.gupshup_source_phone 
  });
  
  // Convert payload to Gupshup format
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
  
  console.log('Gupshup form data:', Object.fromEntries(formData.entries()));
  
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
    
    console.log('Gupshup API response status:', gupshupResponse.status);
    console.log('Gupshup API response headers:', Object.fromEntries(gupshupResponse.headers.entries()));
    console.log('Gupshup API response text:', responseText);
    
    return new Response(responseText, {
      status: gupshupResponse.status,
      headers: gupshupResponse.headers
    });
  } catch (error) {
    console.error('Error calling Gupshup API:', error);
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
    console.log('Parsed Gupshup response:', responseData);
  } catch (parseError) {
    console.error('Failed to parse Gupshup response as JSON:', responseText);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Gupshup API returned invalid response: ${responseText.substring(0, 200)}...`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!gupshupResponse.ok) {
    console.error('Gupshup API error:', responseData);
    return new Response(
      JSON.stringify({
        success: false,
        error: responseData.message || `HTTP ${gupshupResponse.status}: ${gupshupResponse.statusText}`
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
}

export async function sendFallbackMessage(
  fallbackPayload: MessagePayload,
  settings: GupshupSettings
): Promise<Response> {
  console.log('Sending fallback message with payload:', fallbackPayload);
  
  // For Gupshup, we try to send as text message fallback
  const formData = new URLSearchParams();
  formData.append('source', settings.gupshup_source_phone);
  formData.append('destination', fallbackPayload.recipient);
  formData.append('message', fallbackPayload.message || '');
  
  console.log('Fallback form data:', Object.fromEntries(formData.entries()));
  
  try {
    const fallbackResponse = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'apikey': settings.gupshup_api_key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    const fallbackText = await fallbackResponse.text();
    console.log('Fallback response status:', fallbackResponse.status);
    console.log('Fallback response:', fallbackText);

    if (fallbackResponse.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message sent via fallback text (template not available)',
          data: { fallback: true }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: `Fallback also failed: ${fallbackText}`
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fallback message:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Both template and fallback message failed'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
