
export interface WhatsAppRequest {
  phone: string;
  clientName: string;
  amount: string;
  invoiceId: string;
  messageType?: string;
  invoiceUrl?: string;
}

export interface MessagePayload {
  channel: string;
  recipient: string;
  type: string;
  contentSid?: string;
  contentVariables?: Record<string, string>;
  message?: string;
}

export interface TwilioSettings {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_number: string;
}
