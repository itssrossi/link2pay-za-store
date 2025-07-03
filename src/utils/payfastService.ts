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
      return_url: `${baseUrl}/invoice/${invoiceId}?payment=success`,
      cancel_url: `${baseUrl}/invoice/${invoiceId}?payment=cancelled`,
      notify_url: `${baseUrl}/api/payfast/notify/${invoiceId}`
    };
  }

  private static generateSignature(data: Record<string, string>, passphrase?: string): string {
    // Sort parameters alphabetically
    const sortedData = Object.keys(data)
      .sort()
      .reduce((result, key) => {
        result[key] = data[key];
        return result;
      }, {} as Record<string, string>);

    // Create query string
    const queryString = Object.entries(sortedData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value.trim())}`)
      .join('&');

    // Add passphrase if provided
    const finalString = passphrase 
      ? `${queryString}&passphrase=${encodeURIComponent(passphrase.trim())}`
      : queryString;

    // Generate MD5 hash
    return CryptoJS.MD5(finalString).toString();
  }

  public static generatePaymentLink(
    credentials: PayFastCredentials,
    invoiceData: PayFastInvoiceData
  ): string {
    const { return_url, cancel_url, notify_url } = this.getReturnUrls(invoiceData.invoice_id);
    
    const paymentData = {
      merchant_id: credentials.merchant_id,
      merchant_key: credentials.merchant_key,
      amount: invoiceData.amount.toFixed(2),
      item_name: `Invoice #${invoiceData.invoice_number}`,
      return_url,
      cancel_url,
      notify_url
    };

    // Generate signature
    const signature = this.generateSignature(paymentData, credentials.passphrase);
    
    // Add signature to data
    const finalData = {
      ...paymentData,
      signature
    };

    // Build final URL
    const baseUrl = this.getBaseUrl(credentials.mode);
    const queryString = Object.entries(finalData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `${baseUrl}?${queryString}`;
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

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public static generateTestLink(credentials: PayFastCredentials): string {
    const testData: PayFastInvoiceData = {
      amount: 100.00,
      invoice_number: 'TEST-001',
      client_name: 'Test Client',
      invoice_id: 'test-invoice-id'
    };

    return this.generatePaymentLink(credentials, testData);
  }
}