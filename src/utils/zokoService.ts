
import { supabase } from '@/integrations/supabase/client';

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
    invoiceId: string,
    invoiceUrl?: string
  ): Promise<ZokoApiResponse> {
    try {
      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(clientPhone)) {
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +27821234567)');
      }

      console.log('Sending WhatsApp invoice notification via Edge Function:', {
        phone: clientPhone,
        clientName,
        amount,
        invoiceId,
        invoiceUrl
      });

      // Ensure invoice URL ends with a space to prevent link breaking
      const finalInvoiceUrl = invoiceUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
      const invoiceUrlWithSpace = finalInvoiceUrl.endsWith(' ') ? finalInvoiceUrl : finalInvoiceUrl + ' ';

      // Call the Edge Function for invoice notification using template
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: clientPhone,
          clientName: clientName,
          amount: amount,
          invoiceId: invoiceId,
          messageType: 'invoice_notification',
          invoiceUrl: invoiceUrlWithSpace
        }
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send WhatsApp invoice notification'
        };
      }

      if (!data?.success) {
        console.error('WhatsApp invoice notification failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Failed to send WhatsApp invoice notification'
        };
      }

      console.log('WhatsApp invoice notification sent successfully');
      return {
        success: true,
        message: 'WhatsApp invoice notification sent successfully'
      };

    } catch (error) {
      console.error('Error sending WhatsApp invoice notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async sendPaymentConfirmation(
    clientPhone: string,
    clientName: string,
    invoiceNumber: string,
    amount?: string
  ): Promise<ZokoApiResponse> {
    try {
      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(clientPhone)) {
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +27821234567)');
      }

      console.log('Sending payment confirmation via Edge Function:', {
        phone: clientPhone,
        clientName,
        invoiceNumber,
        amount
      });

      // Call the Edge Function for payment confirmation using template
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: clientPhone,
          clientName: clientName,
          amount: amount || 'PAID',
          invoiceId: invoiceNumber,
          messageType: 'payment_confirmation'
        }
      });

      console.log('Payment confirmation response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send payment confirmation'
        };
      }

      if (!data?.success) {
        console.error('Payment confirmation send failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Failed to send payment confirmation'
        };
      }

      console.log('Payment confirmation sent successfully');
      return {
        success: true,
        message: 'Payment confirmation sent successfully'
      };

    } catch (error) {
      console.error('Error sending payment confirmation:', error);
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
