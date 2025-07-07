
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppInvoiceData {
  clientName: string;
  amount: number;
  phoneNumber: string;
  invoiceId: string;
  invoiceUrl: string;
}

export const sendWhatsAppInvoice = async (data: WhatsAppInvoiceData): Promise<boolean> => {
  try {
    // Fetch platform WhatsApp credentials from settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('whatsapp_api_token, whatsapp_phone_id')
      .single();

    if (settingsError || !settings?.whatsapp_api_token) {
      console.error('WhatsApp API credentials not configured');
      return false;
    }

    // Prepare the WhatsApp message payload with proper spacing
    const messagePayload = {
      to: `whatsapp:${data.phoneNumber}`,
      type: 'template',
      template: {
        name: 'invoice_notification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: data.clientName },
              { type: 'text', text: `R${data.amount.toFixed(2)}` },
              { type: 'text', text: `${data.invoiceUrl} ` } // Added space after URL
            ]
          }
        ]
      }
    };

    // Send WhatsApp message via 360dialog API
    const response = await fetch('https://waba.360dialog.io/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.whatsapp_api_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      console.error('WhatsApp API error:', await response.text());
      return false;
    }

    console.log('WhatsApp message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
};

export const normalizePhoneForGupshup = (phone: string): string | null => {
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
};

export const parseQuickInvoiceCommand = (input: string) => {
  // Parse format: l2p:ClientName:Amount:ProductID:Phone
  const match = input.match(/^l2p:(.+?):(\d+(?:\.\d{2})?):([^:]+):(\+\d{1,15})$/i);
  if (!match) return null;
  
  const [, clientName, amount, productId, phoneNumber] = match;
  const parsedAmount = parseFloat(amount);
  
  // Validate inputs
  if (!clientName.trim()) {
    return { error: 'Client name cannot be empty' };
  }
  
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { error: 'Amount must be a valid positive number' };
  }

  const normalizedPhone = normalizePhoneForGupshup(phoneNumber);
  if (!normalizedPhone) {
    return { error: 'Phone number must be valid (e.g., 0821234567, 27821234567, or +27821234567)' };
  }
  
  return {
    clientName: clientName.trim(),
    amount: parsedAmount,
    productId: productId.trim(),
    phoneNumber: normalizedPhone
  };
};
