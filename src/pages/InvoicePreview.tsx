
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

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

interface Profile {
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
}

interface PaymentMethods {
  snapscan_link: string;
  payfast_link: string;
  eft_bank_name: string;
  eft_account_holder: string;
  eft_account_number: string;
  eft_branch_code: string;
}

const InvoicePreview = () => {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods | null>(null);
  const [loading, setLoading] = useState(true);

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
      setItems(itemsData || []);

      // Fetch business profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', invoiceData.user_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch payment methods
      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', invoiceData.user_id)
        .single();

      setPaymentMethods(paymentData);

    } catch (error) {
      console.error('Error fetching invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!profile?.whatsapp_number || !invoice) return;
    
    const message = `Hi! I received the invoice ${invoice.invoice_number} for R${Number(invoice.total_amount).toFixed(2)}. I'd like to make payment.`;
    const whatsappLink = `https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
      </div>
    );
  }

  if (!invoice || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-4">This invoice may have been removed or the link is invalid.</p>
            <Button asChild>
              <a href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-4">
              {profile.logo_url && (
                <img
                  src={profile.logo_url}
                  alt={profile.business_name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.business_name}</h1>
                {profile.store_bio && (
                  <p className="text-gray-600 mt-1">{profile.store_bio}</p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-[#4C9F70] mb-2">
                INVOICE
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {invoice.invoice_number}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Date: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </div>
              <Badge className="mt-2" variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white shadow">
          <div className="p-6">
            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To:</h3>
              <div className="text-gray-800">
                <div className="font-medium">{invoice.client_name}</div>
                {invoice.client_email && (
                  <div className="text-gray-600">{invoice.client_email}</div>
                )}
                {invoice.client_phone && (
                  <div className="text-gray-600">{invoice.client_phone}</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-900">Item</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-900">Qty</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Unit Price</th>
                      <th className="text-right py-3 px-2 font-semibold text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-4 px-2">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-2 text-center text-gray-800">{item.quantity}</td>
                        <td className="py-4 px-2 text-right text-gray-800">
                          R{Number(item.unit_price).toFixed(2)}
                        </td>
                        <td className="py-4 px-2 text-right font-medium text-gray-900">
                          R{Number(item.total_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full max-w-sm">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">R{Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {invoice.vat_enabled && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">VAT (15%):</span>
                    <span className="font-medium">R{Number(invoice.vat_amount).toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-[#4C9F70]">
                    R{Number(invoice.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            {invoice.payment_instructions && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Instructions:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{invoice.payment_instructions}</p>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {paymentMethods && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Options:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.snapscan_link && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">SnapScan</h4>
                        <Button 
                          asChild 
                          className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
                        >
                          <a href={paymentMethods.snapscan_link} target="_blank" rel="noopener noreferrer">
                            Pay with SnapScan
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {paymentMethods.payfast_link && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">PayFast</h4>
                        <Button 
                          asChild 
                          className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
                        >
                          <a href={paymentMethods.payfast_link} target="_blank" rel="noopener noreferrer">
                            Pay with PayFast
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {paymentMethods.eft_bank_name && (
                    <Card className="md:col-span-2">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-3">EFT Banking Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Bank:</span>
                            <div className="font-medium">{paymentMethods.eft_bank_name}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Account Holder:</span>
                            <div className="font-medium">{paymentMethods.eft_account_holder}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Account Number:</span>
                            <div className="font-medium">{paymentMethods.eft_account_number}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Branch Code:</span>
                            <div className="font-medium">{paymentMethods.eft_branch_code}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-b-lg shadow p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleWhatsAppContact}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact via WhatsApp
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by <span className="font-semibold text-[#4C9F70]">Link2Pay</span></p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
