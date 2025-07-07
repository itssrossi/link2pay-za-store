
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function formatPhoneNumber(phone: string): string {
  // Normalize to Gupshup format (E.164 without +)
  if (phone.startsWith('+')) {
    return phone.substring(1);
  }
  return phone;
}

export function normalizePhoneForGupshup(phone: string): string | null {
  if (!phone.trim()) return null;
  
  // Remove all spaces, brackets, dashes, and other non-digit characters except +
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/[^\d+]/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('+27')) {
    // Remove the + for Gupshup format
    return cleaned.substring(1);
  } else if (cleaned.startsWith('27')) {
    // Already in correct format
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    // Replace leading 0 with 27
    return '27' + cleaned.substring(1);
  }
  
  // Invalid format
  return null;
}

export function generateInvoiceUrl(invoiceId: string, customUrl?: string): string {
  return customUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
}
