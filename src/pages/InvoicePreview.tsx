
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Download, ArrowLeft } from 'lucide-react';

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
  status: string;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface BusinessProfile {
  business_name: string;
  whatsapp_number: string;
  logo_url: string;
  snapscan_link: string;
  payfast_link: string;
  eft_details: string;
}

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_number', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceData.id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch business profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_name, whatsapp_number, logo_url, snapscan_link, payfast_link, eft_details')
        .eq('id', invoiceData.user_id)
        .single();

      if (profileError) throw profileError;
      setBusiness(profileData);

    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!business?.whatsapp_number || !invoice) return;
    
    const message = `Hi! I have a question about invoice ${invoice.invoice_number} for R${invoice.total_amount.toFixed(2)}.`;
    const whatsappLink = `https://wa.me/${business.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  if (!invoice || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-4">This invoice may not exist or is no longer available.</p>
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                {business.logo_url && (
                  <img
                    src={business.logo_url}
                    alt={business.business_name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div>
                  <CardTitle className="text-2xl text-[#4C9F70]">
                    {business.business_name}
                  </CardTitle>
                  <p className="text-gray-600">Invoice #{invoice.invoice_number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Date: {new Date(invoice.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  Status: <span className="font-medium">{invoice.status}</span>
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Client Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="font-medium">{invoice.client_name}</p>
              {invoice.client_email && <p className="text-gray-600">{invoice.client_email}</p>}
              {invoice.client_phone && <p className="text-gray-600">{invoice.client_phone}</p>}
            </div>

            {/* Invoice Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Item</th>
                      <th className="border border-gray-200 px-4 py-2 text-center">Qty</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Unit Price</th>
                      <th className="border border-gray-200 px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="border border-gray-200 px-4 py-2">
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-center">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          R{item.unit_price.toFixed(2)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          R{item.total_price.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.vat_enabled && (
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>R{(invoice.vat_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold text-[#4C9F70]">
                  <span>Total:</span>
                  <span>R{invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            {invoice.payment_instructions && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.payment_instructions}</p>
              </div>
            )}

            {/* Payment Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {business.snapscan_link && (
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <a href={business.snapscan_link} target="_blank" rel="noopener noreferrer">
                    Pay with SnapScan
                  </a>
                </Button>
              )}
              {business.payfast_link && (
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <a href={business.payfast_link} target="_blank" rel="noopener noreferrer">
                    Pay with PayFast
                  </a>
                </Button>
              )}
              <Button onClick={handleWhatsAppContact} className="bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact via WhatsApp
              </Button>
            </div>

            {/* EFT Details */}
            {business.eft_details && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">EFT Payment Details:</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{business.eft_details}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Powered by <span className="font-semibold text-[#4C9F70]">Link2Pay</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
