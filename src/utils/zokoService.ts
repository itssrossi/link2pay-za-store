
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
  private static async getPlatformSettings() {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('zoko_api_key, zoko_business_phone, zoko_base_url')
      .single();

    if (error) {
      console.error('Error fetching Zoko settings:', error);
      throw new Error('Failed to load WhatsApp settings');
    }

    if (!data?.zoko_api_key) {
      throw new Error('Zoko API key not configured');
    }

    return data;
  }

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

      const settings = await this.getPlatformSettings();
      
      // Construct invoice link
      const invoiceLink = `${window.location.origin}/invoice/${invoiceId}`;
      
      const messagePayload = {
        phone: clientPhone,
        template_name: 'invoice_notification',
        params: {
          name: clientName,
          amount: amount,
          link: invoiceLink
        }
      };

      console.log('Sending WhatsApp message via Zoko:', {
        phone: clientPhone,
        template: 'invoice_notification',
        clientName,
        amount
      });

      const response = await fetch(settings.zoko_base_url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.zoko_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Zoko API error:', responseData);
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      console.log('WhatsApp message sent successfully via Zoko');
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
