
import type { MessagePayload } from './types.ts';
import { formatTwilioWhatsAppNumber } from './utils.ts';

export function createPaymentConfirmationPayload(
  phone: string,
  clientName: string,
  invoiceId: string
): MessagePayload {
  const formattedPhone = formatTwilioWhatsAppNumber(phone);
  
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    contentSid: "HXff53d0f9bd0c972c5921bf18fe6d7a79",
    contentVariables: {
      "1": clientName,
      "2": invoiceId
    }
  };
}

export function createInvoiceNotificationPayload(
  phone: string,
  clientName: string,
  finalInvoiceUrl: string,
  amount: string
): MessagePayload {
  const formattedPhone = formatTwilioWhatsAppNumber(phone);
  
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    contentSid: "HX52f517a3d75eadafd259aab4c29bc919",
    contentVariables: {
      "1": clientName,
      "2": amount,
      "3": finalInvoiceUrl
    }
  };
}

export function createFallbackTextPayload(
  phone: string,
  clientName: string,
  messageType: string,
  invoiceId: string,
  amount: string,
  finalInvoiceUrl?: string
): MessagePayload {
  const formattedPhone = formatTwilioWhatsAppNumber(phone);
  
  let fallbackMessage: string;
  
  if (messageType === 'payment_confirmation') {
    fallbackMessage = `Hello ${clientName},\n\nPayment received! ✅\n\nYour invoice #${invoiceId} has been marked as PAID. Thank you for your business with us.`;
  } else {
    const invoiceUrl = finalInvoiceUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
    const invoiceUrlWithSpace = invoiceUrl.endsWith(' ') ? invoiceUrl : invoiceUrl + ' ';
    fallbackMessage = `Hi ${clientName}, here's your invoice for R${amount}: ${invoiceUrlWithSpace}\nPlease reach out if you have any questions. Please send through the invoice.`;
  }

  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "text",
    message: fallbackMessage
  };
}
