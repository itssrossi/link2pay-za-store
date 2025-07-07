
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
    templateId: "cc8e22b9-bc67-4f29-ac84-3fb6116e384d",
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
    templateId: "b02d385c-3e53-4295-aa72-de37527f4fe5",
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
