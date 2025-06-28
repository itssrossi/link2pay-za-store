import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { sendWhatsAppInvoice, validatePhoneNumber } from '@/utils/whatsappService';

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
}

const InvoiceBuilder = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [invoiceData, setInvoiceData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    payment_instructions: '',
    vat_enabled: false
  });

  const [whatsappData, setWhatsappData] = useState({
    send_whatsapp: false,
    whatsapp_phone: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      title: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('business_name, whatsapp_number')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total price when quantity or unit_price changes
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const vatAmount = invoiceData.vat_enabled ? subtotal * 0.15 : 0;
    const total = subtotal + vatAmount;
    
    return { subtotal, vatAmount, total };
  };

  const generateInvoice = async () => {
    if (!user || !invoiceData.client_name.trim()) {
      toast.error('Please fill in the client name');
      return;
    }

    const validItems = items.filter(item => item.title.trim() && item.unit_price > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one valid item');
      return;
    }

    // Validate WhatsApp phone if sending WhatsApp
    if (whatsappData.send_whatsapp) {
      if (!whatsappData.whatsapp_phone.trim()) {
        toast.error('Please enter a WhatsApp phone number');
        return;
      }
      if (!validatePhoneNumber(whatsappData.whatsapp_phone)) {
        toast.error('Please enter a valid phone number in E.164 format (e.g., +27821234567)');
        return;
      }
    }

    setLoading(true);

    try {
      const { subtotal, vatAmount, total } = calculateTotals();
      const invoiceNumber = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: invoiceData.client_name,
          client_email: invoiceData.client_email,
          client_phone: invoiceData.client_phone,
          subtotal,
          vat_amount: vatAmount,
          total_amount: total,
          vat_enabled: invoiceData.vat_enabled,
          payment_instructions: invoiceData.payment_instructions,
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Failed to create invoice');

      // Create invoice items
      const invoiceItems = validItems.map(item => ({
        invoice_id: invoice.id,
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      const invoiceUrl = `${window.location.origin}/invoice/${invoice.invoice_number}`;

      // Send WhatsApp message if requested
      if (whatsappData.send_whatsapp) {
        const whatsappSuccess = await sendWhatsAppInvoice({
          clientName: invoiceData.client_name,
          amount: total,
          phoneNumber: whatsappData.whatsapp_phone,
          invoiceId: invoice.id,
          invoiceUrl: invoiceUrl
        });

        if (whatsappSuccess) {
          toast.success(`Invoice created and WhatsApp message sent to ${whatsappData.whatsapp_phone}!`);
        } else {
          toast.error('Invoice created, but WhatsApp message failed. Please check API settings.');
        }
      } else {
        // Generate WhatsApp message for manual sending
        const message = `Hi ${invoiceData.client_name}, here's your invoice for R${total.toFixed(2)}: ${invoiceUrl}`;
        const whatsappLink = `https://wa.me/${profile?.whatsapp_number?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp
        window.open(whatsappLink, '_blank');
        toast.success('Invoice created and WhatsApp opened!');
      }
      
      // Reset form
      setInvoiceData({
        client_name: '',
        client_email: '',
        client_phone: '',
        payment_instructions: '',
        vat_enabled: false
      });
      setWhatsappData({
        send_whatsapp: false,
        whatsapp_phone: ''
      });
      setItems([{
        id: '1',
        title: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0
      }]);

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Builder</h1>
          <p className="text-gray-600 mt-1">
            Create professional invoices and send them via WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
                <CardDescription>
                  Enter your client's details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client_name">Client Name *</Label>
                  <Input
                    id="client_name"
                    value={invoiceData.client_name}
                    onChange={(e) => setInvoiceData({ ...invoiceData, client_name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_email">Email (Optional)</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={invoiceData.client_email}
                      onChange={(e) => setInvoiceData({ ...invoiceData, client_email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Phone (Optional)</Label>
                    <Input
                      id="client_phone"
                      type="tel"
                      value={invoiceData.client_phone}
                      onChange={(e) => setInvoiceData({ ...invoiceData, client_phone: e.target.value })}
                      placeholder="27821234567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  WhatsApp Delivery
                </CardTitle>
                <CardDescription>
                  Send invoice automatically via WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_whatsapp"
                    checked={whatsappData.send_whatsapp}
                    onCheckedChange={(checked) => setWhatsappData({ ...whatsappData, send_whatsapp: !!checked })}
                  />
                  <Label htmlFor="send_whatsapp" className="text-sm font-medium">
                    Send invoice via WhatsApp automatically
                  </Label>
                </div>
                
                {whatsappData.send_whatsapp && (
                  <div>
                    <Label htmlFor="whatsapp_phone">WhatsApp Phone Number *</Label>
                    <Input
                      id="whatsapp_phone"
                      value={whatsappData.whatsapp_phone}
                      onChange={(e) => setWhatsappData({ ...whatsappData, whatsapp_phone: e.target.value })}
                      placeholder="+27821234567"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter phone number in E.164 format (e.g., +27821234567)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Invoice Items</CardTitle>
                    <CardDescription>
                      Add products or services to this invoice
                    </CardDescription>
                  </div>
                  <Button onClick={addItem} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Item {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          placeholder="Product/Service name"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <Label>Unit Price (ZAR)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <Input
                          value={`R${item.total_price.toFixed(2)}`}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
                <CardDescription>
                  Add any special payment instructions for your client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={invoiceData.payment_instructions}
                  onChange={(e) => setInvoiceData({ ...invoiceData, payment_instructions: e.target.value })}
                  placeholder="Payment due within 7 days. Bank transfer preferred."
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Invoice Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>VAT (15%):</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={invoiceData.vat_enabled}
                      onCheckedChange={(checked) => 
                        setInvoiceData({ ...invoiceData, vat_enabled: checked })
                      }
                    />
                    <span>R{vatAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-[#4C9F70]">R{total.toFixed(2)}</span>
                </div>
                
                <Button
                  onClick={generateInvoice}
                  disabled={loading || !invoiceData.client_name.trim()}
                  className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Creating Invoice...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {whatsappData.send_whatsapp ? 'Create & Send via WhatsApp' : 'Create & Send Invoice'}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-600 text-center">
                  {whatsappData.send_whatsapp 
                    ? 'This will create the invoice and send it automatically via WhatsApp'
                    : 'This will create the invoice and open WhatsApp with a pre-filled message'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceBuilder;
