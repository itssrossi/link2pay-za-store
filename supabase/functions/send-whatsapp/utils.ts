
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function formatPhoneNumber(phone: string): string {
  return phone.startsWith('+') ? phone.substring(1) : phone;
}

export function generateInvoiceUrl(invoiceId: string, customUrl?: string): string {
  return customUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
}
