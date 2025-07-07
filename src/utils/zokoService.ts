
import { supabase } from '@/integrations/supabase/client';

interface ZokoApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
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
        console.error('Invalid phone number format:', clientPhone);
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +27821234567)');
      }

      console.log('=== Starting WhatsApp Invoice Send ===');
      console.log('Invoice send parameters:', {
        phone: clientPhone,
        clientName,
        amount,
        invoiceId,
        invoiceUrl,
        timestamp: new Date().toISOString()
      });

      // Ensure invoice URL ends with a space to prevent link breaking
      const finalInvoiceUrl = invoiceUrl || `https://link2pay-za-store.lovable.app/invoice/${invoiceId}`;
      const invoiceUrlWithSpace = finalInvoiceUrl.endsWith(' ') ? finalInvoiceUrl : finalInvoiceUrl + ' ';

      console.log('Processed invoice URL:', {
        original: finalInvoiceUrl,
        withSpace: invoiceUrlWithSpace,
        hasSpace: invoiceUrlWithSpace.endsWith(' ')
      });

      // Call the Edge Function for invoice notification using template
      console.log('Calling send-whatsapp Edge Function...');
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

      console.log('Edge Function response details:', { 
        data, 
        error,
        dataType: typeof data,
        hasData: !!data,
        hasError: !!error
      });

      if (error) {
        console.error('❌ Edge Function returned error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send WhatsApp invoice notification',
          details: error
        };
      }

      if (!data) {
        console.error('❌ Edge Function returned no data');
        return {
          success: false,
          error: 'No response from WhatsApp service'
        };
      }

      if (!data.success) {
        console.error('❌ WhatsApp service reported failure:', data);
        return {
          success: false,
          error: data.error || 'Failed to send WhatsApp invoice notification',
          details: data
        };
      }

      console.log('✅ WhatsApp invoice notification sent successfully:', data);
      return {
        success: true,
        message: data.message || 'WhatsApp invoice notification sent successfully',
        details: data
      };

    } catch (error) {
      console.error('❌ Critical error in sendInvoiceMessage:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { errorType: 'exception', originalError: error }
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
      // Format phone number to ensure E.164 format
      const formattedPhone = this.formatPhoneNumber(clientPhone);
      
      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formattedPhone)) {
        console.error('Invalid phone number format:', formattedPhone);
        throw new Error('Invalid phone number format. Please use E.164 format (e.g., +27821234567)');
      }

      console.log('=== Starting WhatsApp Payment Confirmation ===');
      console.log('Payment confirmation parameters:', {
        phone: clientPhone,
        clientName,
        invoiceNumber,
        amount,
        timestamp: new Date().toISOString()
      });

      // Call the Edge Function for payment confirmation using template
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: formattedPhone,
          clientName: clientName,
          amount: amount || 'PAID',
          invoiceId: invoiceNumber,
          messageType: 'payment_confirmation'
        }
      });

      console.log('Payment confirmation Edge Function response:', { 
        data, 
        error,
        hasData: !!data,
        hasError: !!error
      });

      if (error) {
        console.error('❌ Payment confirmation Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send payment confirmation',
          details: error
        };
      }

      if (!data) {
        console.error('❌ Payment confirmation returned no data');
        return {
          success: false,
          error: 'No response from WhatsApp service'
        };
      }

      if (!data.success) {
        console.error('❌ Payment confirmation service failure:', data);
        return {
          success: false,
          error: data.error || 'Failed to send payment confirmation',
          details: data
        };
      }

      console.log('✅ Payment confirmation sent successfully:', data);
      return {
        success: true,
        message: data.message || 'Payment confirmation sent successfully',
        details: data
      };

    } catch (error) {
      console.error('❌ Critical error in sendPaymentConfirmation:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: { errorType: 'exception', originalError: error }
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
