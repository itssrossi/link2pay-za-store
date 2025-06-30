import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Send, CreditCard } from 'lucide-react';
import { ZokoService } from '@/utils/zokoService';

interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  product_id: string;
}

const InvoiceBuilder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Invoice details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [vatEnabled, setVatEnabled] = useState(false);
  
  // Payment button toggles
  const [showSnapScan, setShowSnapScan] = useState(false);
  const [showPayFast, setShowPayFast] = useState(false);
  
  // WhatsApp settings
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Profile data for payment links
  const [profile, setProfile] = useState<any>(null);
  
  // Invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('snapscan_link, payfast_link')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const addProduct = (product: Product) => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      title: product.title,
      description: product.description,
      quantity: 1,
      unit_price: product.price,
      total_price: product.price
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const addEmptyItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const calculateVAT = () => {
    return vatEnabled ? calculateSubtotal() * 0.15 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT();
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (items.some(item => !item.title.trim())) {
      toast.error('All items must have a title');
      return;
    }
    if (sendWhatsApp && !whatsappNumber.trim()) {
      toast.error('WhatsApp number is required when WhatsApp messaging is enabled');
      return;
    }

    setLoading(true);
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const vatAmount = calculateVAT();
      const totalAmount = calculateTotal();

      // Validate WhatsApp number if sending
      let validatedWhatsAppNumber = '';
      if (sendWhatsApp) {
        validatedWhatsAppNumber = ZokoService.formatPhoneNumber(whatsappNumber);
        if (!ZokoService.validatePhoneNumber(validatedWhatsAppNumber)) {
          toast.error('Invalid WhatsApp number format. Please use E.164 format (e.g., +27821234567)');
          return;
        }
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          subtotal,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          vat_enabled: vatEnabled,
          payment_instructions: paymentInstructions || null,
          show_snapscan: showSnapScan,
          show_payfast: showPayFast,
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: invoice!.id,
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

      // Send WhatsApp message if requested
      if (sendWhatsApp && validatedWhatsAppNumber) {
        const messageResult = await ZokoService.sendInvoiceMessage(
          validatedWhatsAppNumber,
          clientName,
          `R${totalAmount.toFixed(2)}`,
          invoice!.id
        );

        if (messageResult.success) {
          toast.success(`Invoice ${invoiceNumber} created and sent via WhatsApp!`);
        } else {
          toast.warning(`Invoice ${invoiceNumber} created, but WhatsApp message failed: ${messageResult.error}`);
        }
      } else {
        toast.success(`Invoice ${invoiceNumber} created successfully!`);
      }

      navigate(`/invoice/${invoice!.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600 mt-2">
            Build your invoice and optionally send it via WhatsApp
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="clientEmail">Email (Optional)</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="clientPhone">Phone (Optional)</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+27821234567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Payment Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showSnapScan"
                    checked={showSnapScan}
                    onCheckedChange={(checked) => setShowSnapScan(!!checked)}
                    disabled={!profile?.snapscan_link}
                  />
                  <Label htmlFor="showSnapScan">Show SnapScan Payment Button</Label>
                  {!profile?.snapscan_link && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      Link Missing
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPayFast"
                    checked={showPayFast}
                    onCheckedChange={(checked) => setShowPayFast(!!checked)}
                    disabled={!profile?.payfast_link}
                  />
                  <Label htmlFor="showPayFast">Show PayFast Payment Button</Label>
                  {!profile?.payfast_link && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      Link Missing
                    </Badge>
                  )}
                </div>

                {(!profile?.snapscan_link || !profile?.payfast_link) && (
                  <p className="text-xs text-gray-500">
                    💡 Configure payment links in Settings to enable payment buttons
                  </p>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-green-600" />
                  WhatsApp Messaging
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendWhatsApp"
                    checked={sendWhatsApp}
                    onCheckedChange={(checked) => setSendWhatsApp(!!checked)}
                  />
                  <Label htmlFor="sendWhatsApp">Send this invoice via WhatsApp</Label>
                </div>
                
                {sendWhatsApp && (
                  <div>
                    <Label htmlFor="whatsappNumber">Client WhatsApp Number *</Label>
                    <Input
                      id="whatsappNumber"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+27821234567"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must be in E.164 format (e.g., +27821234567)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Title *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                          placeholder="Item title"
                        />
                      </div>
                      
                      <div>
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description (optional)"
                        rows={2}
                      />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Total</Label>
                        <div className="text-lg font-semibold pt-2">
                          R{item.total_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button onClick={addEmptyItem} variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vatEnabled"
                    checked={vatEnabled}
                    onCheckedChange={(checked) => setVatEnabled(!!checked)}
                  />
                  <Label htmlFor="vatEnabled">Include VAT (15%)</Label>
                </div>
                
                <div>
                  <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                  <Textarea
                    id="paymentInstructions"
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Special payment instructions or notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Add Products */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Add Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.title}</p>
                        <p className="text-xs text-gray-500">R{product.price}</p>
                      </div>
                      <Button onClick={() => addProduct(product)} size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{calculateSubtotal().toFixed(2)}</span>
                </div>
                
                {vatEnabled && (
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>R{calculateVAT().toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>R{calculateTotal().toFixed(2)}</span>
                </div>
                
                {(sendWhatsApp || showSnapScan || showPayFast) && (
                  <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded space-y-1">
                    {sendWhatsApp && (
                      <Badge variant="secondary" className="bg-green-500 text-white mr-1">
                        WhatsApp Enabled
                      </Badge>
                    )}
                    {showSnapScan && profile?.snapscan_link && (
                      <Badge variant="secondary" className="bg-blue-500 text-white mr-1">
                        SnapScan
                      </Badge>
                    )}
                    {showPayFast && profile?.payfast_link && (
                      <Badge variant="secondary" className="bg-purple-500 text-white mr-1">
                        PayFast
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#4C9F70] hover:bg-[#3d8159]"
              size="lg"
            >
              {loading ? 'Creating...' : sendWhatsApp ? 'Create & Send Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvoiceBuilder;
