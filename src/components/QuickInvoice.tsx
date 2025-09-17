
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { parseQuickInvoiceCommand, sendWhatsAppInvoice } from '@/utils/whatsappService';

const QuickInvoice = () => {
  const { user } = useAuth();
  const [quickInput, setQuickInput] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Local Pickup');
  const [otherDelivery, setOtherDelivery] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const generateQuickInvoice = async () => {
    if (!user || !quickInput.trim()) {
      toast.error('Please enter invoice details');
      return;
    }

    const parsed = parseQuickInvoiceCommand(quickInput.trim());
    if (!parsed) {
      toast.error('Invalid format. Use: l2p:ClientName:Amount:ProductID:+27821234567');
      return;
    }
    
    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }

    setLoading(true);
    
    try {
      // Validate product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', parsed.productId)
        .eq('user_id', user.id)
        .single();

      if (productError || !product) {
        toast.error(`Product ${parsed.productId} not found`);
        return;
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      const finalDeliveryMethod = deliveryMethod === 'Other' ? otherDelivery : deliveryMethod;
      
      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: parsed.clientName,
          subtotal: parsed.amount,
          total_amount: parsed.amount,
          delivery_method: finalDeliveryMethod,
          status: 'pending',
          payment_enabled: true,
          auto_reminder_enabled: false
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item using product details
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceData.id,
          title: product.title,
          description: product.description,
          quantity: 1,
          unit_price: parsed.amount,
          total_price: parsed.amount
        });

      if (itemError) throw itemError;

      // Check if this is the user's first invoice and update timestamp
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .limit(2);

      if (existingInvoices && existingInvoices.length === 1) {
        // This is the first invoice, update the profile
        await supabase
          .from('profiles')
          .update({ first_invoice_sent_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      const invoiceLink = `${window.location.origin}/invoice/${invoiceData.id}`;
      setGeneratedLink(invoiceLink);

      // Send WhatsApp message
      const whatsappSuccess = await sendWhatsAppInvoice({
        clientName: parsed.clientName,
        amount: parsed.amount,
        phoneNumber: parsed.phoneNumber,
        invoiceId: invoiceData.id,
        invoiceUrl: invoiceLink
      });

      if (whatsappSuccess) {
        toast.success(`Invoice created and WhatsApp message sent to ${parsed.phoneNumber}`);
      } else {
        toast.error('Invoice created, but WhatsApp message failed. Please check API settings.');
      }

      setQuickInput('');
      
    } catch (error) {
      console.error('Error generating quick invoice:', error);
      toast.error('Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Invoice link copied to clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#4C9F70]" />
          Quick Invoice Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quick-invoice">Enhanced Quick Format</Label>
          <Input
            id="quick-invoice"
            placeholder="l2p:John Smith:750:prod-001:+27821234567"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateQuickInvoice()}
          />
          <p className="text-sm text-gray-600">
            Format: l2p:ClientName:Amount:ProductID:+27Phone
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delivery-method">Delivery Method</Label>
          <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Local Pickup">Local Pickup</SelectItem>
              <SelectItem value="Courier Guy">Courier Guy</SelectItem>
              <SelectItem value="Pargo">Pargo</SelectItem>
              <SelectItem value="Door-to-Door">Door-to-Door</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          {deliveryMethod === 'Other' && (
            <Input
              placeholder="Enter delivery method"
              value={otherDelivery}
              onChange={(e) => setOtherDelivery(e.target.value)}
            />
          )}
        </div>
        
        <Button 
          onClick={generateQuickInvoice} 
          disabled={loading || !quickInput.trim()}
          className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Generating...' : 'Generate Invoice & Send WhatsApp'}
        </Button>

        {generatedLink && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">Invoice Generated!</p>
            <div className="flex items-center gap-2">
              <Input 
                value={generatedLink} 
                readOnly 
                className="text-sm bg-white"
              />
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickInvoice;
