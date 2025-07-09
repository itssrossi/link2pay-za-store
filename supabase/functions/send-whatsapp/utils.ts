
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function formatPhoneNumber(phone: string): string {
  // Normalize to Twilio WhatsApp format (whatsapp:+27...)
  const normalized = normalizePhoneForTwilio(phone);
  return normalized ? `whatsapp:+${normalized}` : phone;
}

export function normalizePhoneForTwilio(phone: string): string | null {
  if (!phone.trim()) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('0')) {
    // Replace leading 0 with 27 (South African format)
    return '27' + cleaned.substring(1);
  } else if (cleaned.startsWith('27')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.length === 9) {
    // Assume it's a South African number without country code
    return '27' + cleaned;
  }
  
  // Invalid format
  return null;
}

export function generateInvoiceUrl(invoiceId: string, customUrl?: string): string {
  return customUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
}

export function formatTwilioWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  let number = phone.replace(/\D/g, '');
  
  // Handle different input formats
  if (number.startsWith('0')) {
    number = '27' + number.slice(1);
  } else if (!number.startsWith('27')) {
    number = '27' + number;
  }
  
  return 'whatsapp:+' + number;
}
