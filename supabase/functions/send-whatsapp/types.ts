
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
  templateId?: string;
  templateArgs?: string[];
  message?: string;
}

export interface ZokoSettings {
  zoko_api_key: string;
}
