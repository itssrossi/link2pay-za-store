import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, FileText, Download, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import DeliveryForm from '@/components/DeliveryForm';

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
}

interface Profile {
  business_name: string;
  logo_url: string;
  snapscan_link: string;
  payfast_link: string;
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
        .select('business_name, logo_url, snapscan_link, payfast_link, eft_details, whatsapp_number')
        .eq('id', invoiceData.user_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (method: 'snapscan' | 'payfast') => {
    if (!profile) return;
    
    const link = method === 'snapscan' ? profile.snapscan_link : profile.payfast_link;
    if (!link) {
      toast.error(`${method === 'snapscan' ? 'SnapScan' : 'PayFast'} payment link not available`);
      return;
    }
    
    window.open(link, '_blank');
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
              <p className="text-gray-600">#{invoice.invoice_number}</p>
              <p className="text-sm text-gray-500">
                {new Date(invoice.created_at).toLocaleDateString()}
              </p>
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

          {/* Invoice Details */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Invoice Number:</h3>
                <p className="text-gray-600">#{invoice.invoice_number}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Name:</h3>
                <p className="text-gray-600">{invoice.client_name}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Email:</h3>
                <p className="text-gray-600">{invoice.client_email}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Phone:</h3>
                <p className="text-gray-600">{invoice.client_phone}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subtotal:</h3>
                <p className="text-gray-600">R{invoice.subtotal.toFixed(2)}</p>
              </div>
              {invoice.vat_enabled && (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">VAT (15%):</h3>
                  <p className="text-gray-600">R{invoice.vat_amount.toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total:</h3>
                <p className="text-lg font-bold text-[#4C9F70]">
                  R{invoice.total_amount.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
              onClick={() => downloadInvoicePDF(invoice)}
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
