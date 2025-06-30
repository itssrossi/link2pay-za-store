
import { supabase } from '@/integrations/supabase/client';

interface ZokoMessageParams {
  name: string;
  amount: string;
  link: string;
}

interface ZokoApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class ZokoService {
  static async sendInvoiceMessage(
    clientPhone: string,
    clientName: string,
    amount: string,
    invoiceId: string
  ): Promise<ZokoApiResponse> {
    try {
      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(clientPhone)) {
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +27821234567)');
      }

      console.log('Sending WhatsApp message via Edge Function:', {
        phone: clientPhone,
        clientName,
        amount,
        invoiceId
      });

      // Call the Edge Function which will use the stored platform Zoko credentials
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: clientPhone,
          clientName: clientName,
          amount: amount,
          invoiceId: invoiceId
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send WhatsApp message'
        };
      }

      if (!data.success) {
        console.error('WhatsApp send failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to send WhatsApp message'
        };
      }

      console.log('WhatsApp message sent successfully using platform Zoko credentials');
      return {
        success: true,
        message: 'WhatsApp message sent successfully'
      };

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      // Assume South African number if no country code
      if (cleaned.startsWith('0')) {
        cleaned = '+27' + cleaned.substring(1);
      } else if (cleaned.length === 9) {
        cleaned = '+27' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }
}
