
import CryptoJS from 'crypto-js';

export interface PayFastCredentials {
  merchant_id: string;
  merchant_key: string;
  passphrase?: string;
  mode: 'sandbox' | 'live';
}

export interface PayFastInvoiceData {
  amount: number;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  invoice_id: string;
}

export class PayFastService {
  private static getBaseUrl(mode: 'sandbox' | 'live'): string {
    return mode === 'sandbox' 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  private static getReturnUrls(invoiceId: string) {
    const baseUrl = window.location.origin;
    return {
      return_url: `${baseUrl}/invoice/${invoiceId}?status=success`,
      cancel_url: `${baseUrl}/invoice/${invoiceId}?status=cancelled`,
      notify_url: `https://mlzqlidtvlbijloeusuq.supabase.co/functions/v1/payfast-notify`
    };
  }

  private static generateSignature(data: Record<string, string>, passphrase?: string): string {
    console.log('PayFast: Generating signature for data:', data);
    
    // Remove empty values and sort parameters alphabetically
    const filteredData: Record<string, string> = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        filteredData[key] = value.toString().trim();
      }
    });

    console.log('PayFast: Filtered data for signature:', filteredData);

    // Sort parameters alphabetically by key
    const sortedKeys = Object.keys(filteredData).sort();
    
    // Create query string without URL encoding (PayFast expects raw values for signature)
    const queryString = sortedKeys
      .map(key => `${key}=${filteredData[key]}`)
      .join('&');

    console.log('PayFast: Query string for signature:', queryString);

    // Add passphrase if provided
    const finalString = passphrase && passphrase.trim() 
      ? `${queryString}&passphrase=${passphrase.trim()}`
      : queryString;

    console.log('PayFast: Final string for signature:', finalString);

    // Generate MD5 hash
    const signature = CryptoJS.MD5(finalString).toString();
    console.log('PayFast: Generated signature:', signature);
    
    return signature;
  }

  public static generatePaymentLink(
    credentials: PayFastCredentials,
    invoiceData: PayFastInvoiceData
  ): string {
    console.log('PayFast: Generating payment link with credentials:', { 
      merchant_id: credentials.merchant_id, 
      mode: credentials.mode 
    });
    console.log('PayFast: Invoice data:', invoiceData);

    const { return_url, cancel_url, notify_url } = this.getReturnUrls(invoiceData.invoice_id);
    
    // Split client name into first and last name
    const nameParts = invoiceData.client_name.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';
    
    // Prepare payment data with all required PayFast fields
    const paymentData: Record<string, string> = {
      merchant_id: credentials.merchant_id.trim(),
      merchant_key: credentials.merchant_key.trim(),
      amount: invoiceData.amount.toFixed(2),
      item_name: `Invoice #${invoiceData.invoice_number}`,
      item_description: `Payment for Invoice #${invoiceData.invoice_number}`,
      name_first: firstName,
      name_last: lastName,
      email_address: invoiceData.client_email || 'noreply@example.com',
      return_url,
      cancel_url,
      notify_url,
      custom_str1: invoiceData.invoice_number // Store invoice number for tracking
    };

    console.log('PayFast: Payment data for signature generation:', paymentData);

    // Generate signature using ALL data including merchant_key
    const signature = this.generateSignature(paymentData, credentials.passphrase);
    
    // Create final URL data WITH merchant_key (PayFast requires it)
    const finalUrlData = {
      ...paymentData,
      //signature
    };

    console.log('PayFast: Final URL data:', finalUrlData);

    // Build final URL with proper encoding
    const baseUrl = this.getBaseUrl(credentials.mode);
    const queryString = Object.entries(finalUrlData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    const finalUrl = `${baseUrl}?${queryString}`;
    console.log('PayFast: Generated payment URL:', finalUrl);

    return finalUrl;
  }

  public static validateCredentials(credentials: Partial<PayFastCredentials>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials.merchant_id?.trim()) {
      errors.push('Merchant ID is required');
    }

    if (!credentials.merchant_key?.trim()) {
      errors.push('Merchant Key is required');
    }

    if (!credentials.mode || !['sandbox', 'live'].includes(credentials.mode)) {
      errors.push('Mode must be either sandbox or live');
    }

    // Validate merchant ID format (should be numeric for PayFast)
    if (credentials.merchant_id && !/^\d+$/.test(credentials.merchant_id.trim())) {
      errors.push('Merchant ID should be numeric');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static generateTestLink(credentials: PayFastCredentials): string {
    const testData: PayFastInvoiceData = {
      amount: 100.00,
      invoice_number: 'TEST-001',
      client_name: 'Test Customer',
      client_email: 'test@example.com',
      invoice_id: 'test-invoice-id'
    };

    return this.generatePaymentLink(credentials, testData);
  }
}
