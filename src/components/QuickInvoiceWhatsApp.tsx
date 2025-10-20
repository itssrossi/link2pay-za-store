
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ZokoService } from '@/utils/zokoService';
import { Copy } from 'lucide-react';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';
import { checkWeeklyInvoiceAchievement } from '@/utils/invoiceAchievements';

const QuickInvoiceWhatsApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState('');
  const [showGeneratedLink, setShowGeneratedLink] = useState(false);

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

      const normalizedPhone = ZokoService.normalizePhoneForTwilio(phone);
      if (!normalizedPhone) {
        throw new Error('Invalid phone number format. Use any format: 062..., 27..., or +27...');
      }

    return {
      clientName: clientName.trim(),
      amount: Number(amount),
      productId: productId.trim(),
      phone: normalizedPhone
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

      // Generate invoice link
      const invoiceLink = `${window.location.origin}/invoice/${invoice.id}`;
      setGeneratedLink(invoiceLink);
      setGeneratedInvoiceNumber(invoiceNumber);
      setShowGeneratedLink(true);

      // 🎉 Trigger celebrations!
      triggerConfetti();
      playCelebrationSound();
      
      // Check for weekly achievements
      await checkWeeklyInvoiceAchievement(user.id);

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

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Invoice link copied!');
  };

  const viewInvoice = () => {
    const invoiceId = generatedLink.split('/invoice/')[1];
    navigate(`/invoice/${invoiceId}`);
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

        {showGeneratedLink && (
          <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-green-800">✅ Invoice {generatedInvoiceNumber} Ready!</p>
                <p className="text-sm text-green-600">WhatsApp message sent successfully</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="text-sm bg-white border-green-200"
                />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                onClick={viewInvoice}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Invoice
              </Button>
            </div>
          </div>
        )}

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
