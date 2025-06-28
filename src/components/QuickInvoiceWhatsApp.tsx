
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ZokoService } from '@/utils/zokoService';

const QuickInvoiceWhatsApp = () => {
  const { user } = useAuth();
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);

  const parseCommand = (cmd: string) => {
    const parts = cmd.split(':');
    if (parts.length !== 5 || parts[0] !== 'l2p') {
      throw new Error('Invalid format. Use: l2p:ClientName:Amount:ProductID:+27Phone');
    }

    const [, clientName, amount, productId, phone] = parts;
    
    if (!clientName.trim()) throw new Error('Client name is required');
    if (!amount.trim() || isNaN(Number(amount))) throw new Error('Valid amount is required');
    if (!productId.trim()) throw new Error('Product ID is required');
    if (!phone.trim()) throw new Error('Phone number is required');

    const formattedPhone = ZokoService.formatPhoneNumber(phone);
    if (!ZokoService.validatePhoneNumber(formattedPhone)) {
      throw new Error('Invalid phone number format. Use E.164 format (e.g., +27821234567)');
    }

    return {
      clientName: clientName.trim(),
      amount: Number(amount),
      productId: productId.trim(),
      phone: formattedPhone
    };
  };

  const handleQuickInvoice = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { clientName, amount, productId, phone } = parseCommand(command);

      // Verify product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      if (productError || !product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_phone: phone,
          subtotal: amount,
          total_amount: amount,
          vat_enabled: false,
          vat_amount: 0,
          status: 'pending',
          payment_enabled: true
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          title: product.title,
          description: product.description || '',
          quantity: 1,
          unit_price: amount,
          total_price: amount
        });

      if (itemError) throw itemError;

      // Send WhatsApp message via Zoko
      const messageResult = await ZokoService.sendInvoiceMessage(
        phone,
        clientName,
        `R${amount}`,
        invoice.id
      );

      if (messageResult.success) {
        toast.success(`Invoice ${invoiceNumber} created and sent to ${clientName} via WhatsApp!`);
      } else {
        toast.warning(`Invoice ${invoiceNumber} created, but WhatsApp message failed: ${messageResult.error}`);
      }

      setCommand('');
      
    } catch (error) {
      console.error('Quick invoice error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Invoice with WhatsApp</CardTitle>
        <CardDescription>
          Create and send invoices instantly using the format: l2p:ClientName:Amount:ProductID:+27Phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="l2p:John Doe:500:prod-001:+27821234567"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Format: l2p:ClientName:Amount:ProductID:PhoneNumber
          </p>
        </div>
        
        <Button 
          onClick={handleQuickInvoice}
          disabled={loading || !command.trim()}
          className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Creating Invoice...' : 'Create & Send Invoice'}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 text-sm mb-1">How it works:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Validates product exists and phone format</li>
            <li>• Creates invoice automatically</li>
            <li>• Sends WhatsApp message via Zoko.io API</li>
            <li>• Shows success/failure notification</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickInvoiceWhatsApp;
