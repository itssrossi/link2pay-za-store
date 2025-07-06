
import type { MessagePayload } from './types.ts';

export function createPaymentConfirmationPayload(
  formattedPhone: string,
  clientName: string,
  invoiceId: string
): MessagePayload {
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    templateId: "b1134df2-b45d-42c2-a3b2-1c88c736efcb",
    templateArgs: [clientName, invoiceId]
  };
}

export function createInvoiceNotificationPayload(
  formattedPhone: string,
  clientName: string,
  finalInvoiceUrl: string,
  amount: string
): MessagePayload {
  // Ensure invoice URL has proper spacing
  const invoiceUrlWithSpace = finalInvoiceUrl.endsWith(' ') ? finalInvoiceUrl : finalInvoiceUrl + ' ';
  
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    templateId: "baf7308f-237c-4c93-8926-633e3d82636b",
    templateArgs: [clientName, invoiceUrlWithSpace, amount]
  };
}

export function createFallbackTextPayload(
  formattedPhone: string,
  clientName: string,
  messageType: string,
  invoiceId: string,
  amount: string,
  finalInvoiceUrl?: string
): MessagePayload {
  let fallbackMessage: string;
  
  if (messageType === 'payment_confirmation') {
    fallbackMessage = `Hello ${clientName},\n\nPayment received! ✅\n\nYour invoice #${invoiceId} has been marked as PAID. Thank you for your business with us.`;
  } else {
    const invoiceUrl = finalInvoiceUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
    const invoiceUrlWithSpace = invoiceUrl.endsWith(' ') ? invoiceUrl : invoiceUrl + ' ';
    fallbackMessage = `Hi ${clientName}, here's your invoice for R${amount}: ${invoiceUrlWithSpace}\nPlease reach out if you have any questions.`;
  }

  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "text",
    message: fallbackMessage
  };
}
