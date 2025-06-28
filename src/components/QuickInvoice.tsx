
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Copy } from 'lucide-react';
import { toast } from 'sonner';

const QuickInvoice = () => {
  const { user } = useAuth();
  const [quickInput, setQuickInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const parseQuickInput = (input: string) => {
    // Parse format: l2p:ClientName:R1500 or l2p:ClientName:1500
    const match = input.match(/^l2p:(.+?):(R?)(\d+(?:\.\d{2})?)$/i);
    if (!match) return null;
    
    const [, clientName, , amount] = match;
    return {
      clientName: clientName.trim(),
      amount: parseFloat(amount)
    };
  };

  const generateQuickInvoice = async () => {
    if (!user || !quickInput.trim()) return;

    const parsed = parseQuickInput(quickInput.trim());
    if (!parsed) {
      toast.error('Invalid format. Use: l2p:ClientName:R1500');
      return;
    }

    setLoading(true);
    
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: parsed.clientName,
          subtotal: parsed.amount,
          total_amount: parsed.amount,
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceData.id,
          title: 'Service/Product',
          quantity: 1,
          unit_price: parsed.amount,
          total_price: parsed.amount
        });

      if (itemError) throw itemError;

      const invoiceLink = `${window.location.origin}/invoice/${invoiceData.id}`;
      setGeneratedLink(invoiceLink);
      setQuickInput('');
      toast.success('Quick invoice generated successfully!');
      
    } catch (error) {
      console.error('Error generating quick invoice:', error);
      toast.error('Failed to generate invoice');
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
          <Label htmlFor="quick-invoice">Quick Format</Label>
          <Input
            id="quick-invoice"
            placeholder="l2p:John Smith:R750"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && generateQuickInvoice()}
          />
          <p className="text-sm text-gray-600">
            Format: l2p:ClientName:R1500
          </p>
        </div>
        
        <Button 
          onClick={generateQuickInvoice} 
          disabled={loading || !quickInput.trim()}
          className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Generating...' : 'Generate Invoice'}
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
