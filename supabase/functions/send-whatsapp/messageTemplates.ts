
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
    templateId: "invoice_paid",
    templateArgs: [clientName, invoiceId]
  };
}

export function createInvoiceNotificationPayload(
  formattedPhone: string,
  clientName: string,
  finalInvoiceUrl: string,
  amount: string
): MessagePayload {
  // Add space after URL to prevent template from corrupting the link
  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "template",
    templateId: "invoice_notification",
    templateArgs: [clientName, finalInvoiceUrl + " ", amount]
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
    fallbackMessage = `Hi ${clientName}!\n\nYou have a new invoice for R${amount}.\n\nView and pay your invoice here: ${invoiceUrl}\n\nThank you! 🙏`;
  }

  return {
    channel: "whatsapp",
    recipient: formattedPhone,
    type: "text",
    message: fallbackMessage
  };
}
