import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, FileText, Download, MessageCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { PayFastService, type PayFastCredentials } from '@/utils/payfastService';
import DeliveryForm from '@/components/DeliveryForm';
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
  payment_enabled: boolean;
  status: string;
  created_at: string;
  show_snapscan: boolean;
  show_payfast: boolean;
}

interface Profile {
  business_name: string;
  logo_url: string;
  snapscan_link: string;
  payfast_link: string;
  payfast_merchant_id: string;
  payfast_merchant_key: string;
  payfast_passphrase: string;
  payfast_mode: string;
  eft_details: string;
  whatsapp_number: string;
}

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [payfastCredentials, setPayfastCredentials] = useState<Partial<PayFastCredentials>>({});

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
        .select('business_name, logo_url, snapscan_link, payfast_link, payfast_merchant_id, payfast_merchant_key, payfast_passphrase, payfast_mode, eft_details, whatsapp_number')
        .eq('id', invoiceData.user_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load PayFast credentials for automated payment links
      if (profileData?.payfast_merchant_id && profileData?.payfast_merchant_key) {
        const credentials = {
          merchant_id: profileData.payfast_merchant_id,
          merchant_key: profileData.payfast_merchant_key,
          passphrase: profileData.payfast_passphrase || '',
          mode: (profileData.payfast_mode as 'sandbox' | 'live') || 'sandbox'
        };
        
        console.log('PayFast: Loaded credentials from profile:', { 
          merchant_id: credentials.merchant_id, 
          mode: credentials.mode 
        });
        
        setPayfastCredentials(credentials);
      }

    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (method: 'snapscan' | 'payfast') => {
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
    } else if (method === 'payfast') {
      // Try automated PayFast first, then fall back to manual link
      if (payfastCredentials.merchant_id && payfastCredentials.merchant_key) {
        try {
          console.log('PayFast: Attempting to generate payment link...');
          
          // Validate credentials first
          const validation = PayFastService.validateCredentials(payfastCredentials);
          if (!validation.isValid) {
            console.error('PayFast: Invalid credentials:', validation.errors);
            validation.errors.forEach(error => toast.error(error));
            return;
          }

          const paymentLink = PayFastService.generatePaymentLink(
            payfastCredentials as PayFastCredentials,
            {
              amount: invoice.total_amount,
              invoice_number: invoice.invoice_number,
              client_name: invoice.client_name,
              client_email: invoice.client_email || undefined,
              invoice_id: invoice.id
            }
          );
          
          console.log('PayFast: Generated payment link successfully');
          window.open(paymentLink, '_blank');
          toast.success('PayFast payment link opened in new tab');
        } catch (error) {
          console.error('PayFast: Error generating payment link:', error);
          toast.error('Failed to generate PayFast payment link. Please check your credentials.');
        }
      } else if (profile.payfast_link) {
        console.log('PayFast: Using manual link fallback');
        window.open(profile.payfast_link, '_blank');
      } else {
        toast.error('PayFast payment not configured. Please contact the business owner.');
      }
    }
  };

  const handleOrderNow = () => {
    setShowDeliveryForm(true);
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
        payment_instructions: invoice.payment_instructions,
        eft_details: profile.eft_details,
        snapscan_link: profile.snapscan_link,
        payfast_link: profile.payfast_link,
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              {profile?.logo_url && (
                <img
                  src={profile.logo_url}
                  alt={profile.business_name}
                  className="h-16 w-auto mb-4"
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
            {invoice.delivery_method && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Method:</h3>
                <div className="text-gray-600">
                  <Badge variant="outline" className="text-sm">
                    {invoice.delivery_method}
                  </Badge>
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
          {(invoice.show_snapscan || invoice.show_payfast) && (
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
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {invoice.show_snapscan && profile?.snapscan_link && (
                      <Button
                        size="lg"
                        onClick={() => handlePayment('snapscan')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now with SnapScan
                      </Button>
                    )}

                    {invoice.show_payfast && (payfastCredentials.merchant_id || profile?.payfast_link) && (
                      <Button
                        size="lg"
                        onClick={() => handlePayment('payfast')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now with PayFast
                      </Button>
                    )}

                    {/* Show configuration warnings */}
                    {invoice.show_snapscan && !profile?.snapscan_link && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="text-orange-700 text-sm">
                          ⚠️ SnapScan payment link missing. Please contact the business to update their payment information.
                        </p>
                      </div>
                    )}

                    {invoice.show_payfast && !payfastCredentials.merchant_id && !profile?.payfast_link && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="text-orange-700 text-sm">
                          ⚠️ PayFast payment not configured. Please contact the business to update their payment information.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Form */}
          {showDeliveryForm && profile?.whatsapp_number && (
            <div className="mb-6 sm:mb-8 flex justify-center">
              <DeliveryForm
                productTitle={`Invoice ${invoice.invoice_number}`}
                invoiceLink={window.location.href}
                whatsappNumber={profile.whatsapp_number}
                onSubmit={() => setShowDeliveryForm(false)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            {!showDeliveryForm && profile?.whatsapp_number && (
              <Button
                size="lg"
                onClick={handleOrderNow}
                className="bg-[#4C9F70] hover:bg-[#3d8159] text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Order Now
              </Button>
            )}

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
