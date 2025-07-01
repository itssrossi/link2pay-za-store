
import type { MessagePayload, ZokoSettings } from './types.ts';
import { corsHeaders } from './utils.ts';

export async function sendZokoMessage(
  messagePayload: MessagePayload,
  settings: ZokoSettings
): Promise<Response> {
  console.log('Calling Zoko API with payload:', JSON.stringify(messagePayload, null, 2));
  
  const zokoResponse = await fetch('https://chat.zoko.io/v2/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': settings.zoko_api_key
    },
    body: JSON.stringify(messagePayload)
  });

  const responseText = await zokoResponse.text();
  
  console.log('Zoko API response status:', zokoResponse.status);
  console.log('Zoko API response text:', responseText);
  
  return new Response(responseText, {
    status: zokoResponse.status,
    headers: zokoResponse.headers
  });
}

export async function handleZokoResponse(
  zokoResponse: Response,
  messageType: string
): Promise<Response> {
  const responseText = await zokoResponse.text();
  let responseData;
  
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
  settings: ZokoSettings
): Promise<Response> {
  console.log('Sending fallback message...');
  
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
        message: 'Message sent via fallback text (template not available)',
        data: { fallback: true }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Both template and fallback message failed'
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
