
import type { MessagePayload } from './types.ts';

export function createPaymentConfirmationPayload(
  formattedPhone: string,
  clientName: string,
  invoiceId: string
): MessagePayload {
  const message = `Hello ${clientName},  
Payment received! ✅

Your invoice #${invoiceId} has been marked as PAID.
Thank you for your business with us`;
  
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    templateId: "HXff53d0f9bd0c972c5921bf18fe6d7a79",
    message: message
  };
}

export function createInvoiceNotificationPayload(
  formattedPhone: string,
  clientName: string,
  finalInvoiceUrl: string,
  amount: string
): MessagePayload {
  const message = `Hi ${clientName}, here's your invoice for ${amount} : ${finalInvoiceUrl}.
Please reach out if you have any questions.`;
  
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    templateId: "HX52f517a3d75eadafd259aab4c29bc919",
    message: message
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
