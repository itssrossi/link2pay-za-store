import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, CreditCard, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
// PayFast integration removed - migrated to Paystack
import InvoiceStatusBadge from '@/components/InvoiceStatusBadge';

interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  vat_enabled: boolean;
  payment_instructions: string;
  delivery_method: string;
  delivery_address?: string;
  delivery_notes?: string;
  delivery_date?: string;
  delivery_fee?: number;
  payment_enabled: boolean;
  status: string;
  created_at: string;
  show_snapscan: boolean;
  show_payfast: boolean;
  auto_reminder_enabled: boolean;
  reminder_sent_at: string | null;
  updated_at: string;
  user_id: string;
  whatsapp_paid_sent: boolean;
}

interface Profile {
  business_name: string;
  logo_url: string;
  snapscan_link: string;
  eft_details: string;
  whatsapp_number: string;
  store_address: string;
  capitec_paylink: string;
  show_capitec: boolean;
  payfast_merchant_id: string;
  payfast_merchant_key: string;
  payfast_passphrase: string;
  show_payfast_auto: boolean;
}

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // PayFast credentials removed - migrated to Paystack

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;
      setInvoiceItems(itemsData || []);

      // Fetch business profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, logo_url, snapscan_link, eft_details, whatsapp_number, store_address, capitec_paylink, show_capitec, payfast_merchant_id, payfast_merchant_key, payfast_passphrase, show_payfast_auto')
        .eq('id', invoiceData.user_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // PayFast credentials removed - migrated to Paystack
      // Payment integration now handled by Paystack subscription system

    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const generatePayfastCheckoutUrl = (merchantId: string, merchantKey: string, passphrase: string) => {
    if (!invoice || !profile) return '';
    
    const data = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${window.location.origin}/invoice/${invoice.id}?payment=success`,
      cancel_url: `${window.location.origin}/invoice/${invoice.id}?payment=cancelled`,
      notify_url: `${window.location.origin}/api/payfast/notify`,
      amount: invoice.total_amount.toFixed(2),
      item_name: `Invoice ${invoice.invoice_number}`,
      item_description: `Payment for Invoice ${invoice.invoice_number}`,
      email_address: invoice.client_email || 'customer@example.com',
      name_first: invoice.client_name.split(' ')[0] || 'Customer',
      name_last: invoice.client_name.split(' ').slice(1).join(' ') || 'Name',
    };

    // Generate signature if passphrase is provided
    let queryString = Object.entries(data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (passphrase) {
      queryString += `&passphrase=${encodeURIComponent(passphrase)}`;
    }

    return `https://www.payfast.co.za/eng/process?${queryString}`;
  };

  const handlePayment = (method: 'snapscan' | 'payfast' | 'capitec') => {
    if (!profile || !invoice) return;
    
    // Check if invoice is already paid
    if (invoice?.status === 'paid') {
      toast.info('This invoice has already been paid. Thank you!');
      return;
    }
    
    if (method === 'snapscan') {
      const link = profile.snapscan_link;
      if (!link) {
        toast.error('SnapScan payment link not available');
        return;
      }
      window.open(link, '_blank');
    } else if (method === 'capitec') {
      const link = profile.capitec_paylink;
      if (!link) {
        toast.error('Capitec Pay Me link not available');
        return;
      }
      window.open(link, '_blank');
    } else if (method === 'payfast') {
      if (!profile.show_payfast_auto || !profile.payfast_merchant_id || !profile.payfast_merchant_key) {
        toast.error('PayFast credentials not configured');
        return;
      }
      
      const checkoutUrl = generatePayfastCheckoutUrl(
        profile.payfast_merchant_id,
        profile.payfast_merchant_key,
        profile.payfast_passphrase || ''
      );
      
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      } else {
        toast.error('Failed to generate PayFast checkout URL');
      }
    }
  };

  const downloadInvoicePDF = async () => {
    if (!invoice || !profile) {
      toast.error('Invoice not found. Please try again later.');
      return;
    }

    try {
      toast.info('Generating PDF...');
      
      await generateInvoicePDF({
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        client_phone: invoice.client_phone,
        business_name: profile.business_name,
        logo_url: profile.logo_url,
        items: invoiceItems.map(item => ({
          title: item.title,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: invoice.subtotal,
        vat_amount: invoice.vat_amount,
        total_amount: invoice.total_amount,
        delivery_method: invoice.delivery_method,
        delivery_address: invoice.delivery_address,
        delivery_notes: invoice.delivery_notes,
        delivery_date: invoice.delivery_date,
        delivery_fee: invoice.delivery_fee || 0,
        payment_instructions: invoice.payment_instructions,
        eft_details: profile.eft_details,
        snapscan_link: profile.snapscan_link,
        // PayFast link removed
        capitec_paylink: profile.capitec_paylink,
        show_capitec: profile.show_capitec,
        store_address: profile.store_address,
        payment_enabled: invoice.payment_enabled,
        created_at: invoice.created_at,
      });
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-4">
              This invoice may not exist or is no longer available. Please check the URL and try again.
            </p>
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInvoicePaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              {profile?.logo_url && (
                <img
                  src={profile.logo_url}
                  alt={profile.business_name}
                  className="h-16 w-auto mb-4"
                  loading="eager"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.business_name || 'Business Name'}
              </h1>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <p className="text-gray-600 mb-4">
                #{invoice.invoice_number}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
              
              {/* Status Badge */}
              <div className="flex justify-end">
                <InvoiceStatusBadge status={invoice.status} size="lg" />
              </div>
            </div>
          </div>

          {/* Bill To & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
              <div className="text-gray-600">
                <p className="font-medium">{invoice.client_name}</p>
                {invoice.client_email && <p>{invoice.client_email}</p>}
                {invoice.client_phone && <p>{invoice.client_phone}</p>}
              </div>
            </div>
            
            {/* Delivery Information */}
            {invoice.delivery_method && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Information:
                </h3>
                <div className="text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {invoice.delivery_method}
                    </Badge>
                  </div>
                  
                  {/* Show store address for Local Pickup */}
                  {invoice.delivery_method === 'Local Pickup' && profile?.store_address && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Pickup Location:</p>
                          <p className="text-sm text-blue-800 whitespace-pre-line">{profile.store_address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {invoice.delivery_address && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address:</p>
                      <p className="text-sm">{invoice.delivery_address}</p>
                    </div>
                  )}
                  
                  {invoice.delivery_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Expected Date:</p>
                      <p className="text-sm">{new Date(invoice.delivery_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {invoice.delivery_notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes:</p>
                      <p className="text-sm">{invoice.delivery_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-900">Description</th>
                      <th className="text-right py-3 font-medium text-gray-900">Qty</th>
                      <th className="text-right py-3 font-medium text-gray-900">Unit Price</th>
                      <th className="text-right py-3 font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 text-gray-600">{item.quantity}</td>
                        <td className="text-right py-3 text-gray-600">R{item.unit_price.toFixed(2)}</td>
                        <td className="text-right py-3 font-medium text-gray-900">
                          R{item.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Items Subtotal:</span>
                <span className="font-medium">R{(invoice.subtotal - (invoice.delivery_fee || 0)).toFixed(2)}</span>
              </div>
              
              {(invoice.delivery_fee || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">R{(invoice.delivery_fee || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">R{invoice.subtotal.toFixed(2)}</span>
              </div>
              
              {invoice.vat_enabled && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">VAT (15%):</span>
                  <span className="font-medium">R{invoice.vat_amount.toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between py-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-bold text-[#4C9F70]">
                  R{invoice.total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Buttons */}
          {(invoice.show_snapscan || invoice.show_payfast || profile?.show_capitec || profile?.show_payfast_auto) && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {isInvoicePaid ? 'Payment Received' : 'Quick Payment Options'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isInvoicePaid ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-green-700 mb-2 text-lg font-semibold">
                      🎉 Payment already received — thank you!
                    </div>
                    <p className="text-green-600 text-sm">
                      This invoice has been marked as paid. No further payment is required.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoice.show_snapscan && profile?.snapscan_link && (
                      <Button
                        size="lg"
                        onClick={() => handlePayment('snapscan')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with SnapScan
                      </Button>
                    )}

                    {profile?.show_payfast_auto && profile?.payfast_merchant_id && profile?.payfast_merchant_key && (
                      <Button
                        size="lg"
                        onClick={() => handlePayment('payfast')}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with PayFast
                      </Button>
                    )}

                    {profile?.show_capitec && profile?.capitec_paylink && (
                      <Button
                        size="lg"
                        onClick={() => handlePayment('capitec')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with Capitec
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center items-center mb-8">
            <Button
              size="lg"
              variant="outline"
              onClick={downloadInvoicePDF}
              className="px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* Payment Instructions */}
          {invoice.payment_instructions && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Instructions:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {invoice.payment_instructions}
                </pre>
              </div>
            </div>
          )}

          {/* EFT Details */}
          {profile?.eft_details && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Banking Details:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {profile.eft_details}
                </pre>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge 
              variant={invoice.status === 'paid' ? 'default' : 'secondary'}
              className="text-sm px-4 py-2"
            >
              Status: {invoice.status?.toUpperCase() || 'PENDING'}
            </Badge>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Powered by <span className="font-semibold text-[#4C9F70]">Link2Pay</span></p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
