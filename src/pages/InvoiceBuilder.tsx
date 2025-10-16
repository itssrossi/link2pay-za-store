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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Send, CreditCard, Truck } from 'lucide-react';
import { ZokoService } from '@/utils/zokoService';
import { CompletionPopup } from '@/components/ui/completion-popup';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';
import { checkWeeklyInvoiceAchievement } from '@/utils/invoiceAchievements';
// PayFast integration removed - migrated to Paystack

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
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [isFirstInvoice, setIsFirstInvoice] = useState(false);
  
  // View mode toggle
  const [viewMode, setViewMode] = useState<'simple' | 'normal'>('normal');
  const [simpleAmount, setSimpleAmount] = useState<number>(0);
  
  // Invoice details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [vatEnabled, setVatEnabled] = useState(false);
  
  // Delivery details
  const [deliveryMethod, setDeliveryMethod] = useState('Local Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  // Payment button toggles
  const [showSnapScan, setShowSnapScan] = useState(false);
  const [showPayFast, setShowPayFast] = useState(false);
  
  // WhatsApp settings
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Profile data for payment links
  const [profile, setProfile] = useState<any>(null);
  // PayFast credentials removed - migrated to Paystack
  
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
      checkExistingInvoices();
    }
  }, [user]);

  const checkExistingInvoices = async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setIsFirstInvoice((count || 0) === 0);
    } catch (error) {
      console.error('Error checking existing invoices:', error);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('snapscan_link, show_payfast_auto, payfast_merchant_id, show_capitec, capitec_paylink')
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
    return items.reduce((sum, item) => sum + item.total_price, 0) + deliveryFee;
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
    if (!clientPhone.trim()) {
      toast.error('Please enter the client\'s phone number to send the invoice.');
      return;
    }
    
    // Handle simple mode - create a single item from the simple amount
    let itemsToSubmit = items;
    if (viewMode === 'simple') {
      if (!simpleAmount || simpleAmount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      itemsToSubmit = [{
        id: crypto.randomUUID(),
        title: 'Service/Product',
        description: '',
        quantity: 1,
        unit_price: simpleAmount,
        total_price: simpleAmount
      }];
    } else {
      if (items.some(item => !item.title.trim())) {
        toast.error('All items must have a title');
        return;
      }
      itemsToSubmit = items;
    }
    
    // Normalize phone number for all purposes
    const normalizedPhone = ZokoService.normalizePhoneForTwilio(clientPhone);
    if (!normalizedPhone) {
      toast.error('Please enter a valid phone number (062..., 27..., or +27...)');
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
        
        console.log('WhatsApp number validation:', {
          original: whatsappNumber,
          formatted: validatedWhatsAppNumber,
          isValid: ZokoService.validatePhoneNumber(validatedWhatsAppNumber)
        });
      }

      console.log('Creating invoice with details:', {
        invoiceNumber,
        clientName,
        totalAmount,
        sendWhatsApp,
        validatedWhatsAppNumber
      });

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: normalizedPhone,
          subtotal,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          vat_enabled: vatEnabled,
          payment_instructions: paymentInstructions || null,
          show_snapscan: showSnapScan,
          show_payfast: showPayFast,
          delivery_method: deliveryMethod,
          delivery_address: deliveryAddress || null,
          delivery_notes: deliveryNotes || null,
          delivery_date: deliveryDate || null,
          delivery_fee: deliveryFee,
          status: 'pending'
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice created successfully:', invoice);

      // Create invoice items
      const invoiceItems = itemsToSubmit.map(item => ({
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

      if (itemsError) {
        console.error('Invoice items creation error:', itemsError);
        throw itemsError;
      }

      console.log('Invoice items created successfully');

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

      // Send WhatsApp message if requested
      if (sendWhatsApp && validatedWhatsAppNumber) {
        console.log('Attempting to send WhatsApp message...');
        
        // Show immediate feedback
        toast.success(`Invoice ${invoiceNumber} created! Sending WhatsApp message...`);
        
        try {
          const messageResult = await ZokoService.sendInvoiceMessage(
            validatedWhatsAppNumber,
            clientName,
            `R${totalAmount.toFixed(2)}`,
            invoice!.id
          );

          console.log('WhatsApp send result:', messageResult);

          if (messageResult.success) {
            playCelebrationSound();
            toast.success('Invoice sent! Let\'s get you paid 💸');
            await checkWeeklyInvoiceAchievement(user.id);
          } else {
            console.error('WhatsApp send failed:', messageResult);
            toast.error(`Invoice ${invoiceNumber} created, but WhatsApp failed: ${messageResult.error || 'Unknown error'}`);
            
            // Show detailed error if available
            if (messageResult.details) {
              console.error('WhatsApp error details:', messageResult.details);
            }
          }
        } catch (whatsappError) {
          console.error('WhatsApp send exception:', whatsappError);
          toast.error(`Invoice ${invoiceNumber} created, but WhatsApp send failed: ${whatsappError.message}`);
        }
      } else {
        playCelebrationSound();
        toast.success('Invoice sent! Let\'s get you paid 💸');
        await checkWeeklyInvoiceAchievement(user.id);
      }

      // Only show completion popup and confetti for first invoice
      if (isFirstInvoice) {
        triggerConfetti();
        setShowCompletionPopup(true);
        
        // Navigate after a delay to show the popup
        setTimeout(() => {
          navigate(`/invoice/${invoice!.id}`);
        }, 2000);
      } else {
        // Navigate immediately for subsequent invoices
        navigate(`/invoice/${invoice!.id}`);
      }
      
    } catch (error) {
      console.error('Critical error creating invoice:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(`Failed to create invoice: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-gray-600 mt-2">
              Build your invoice and optionally send it via WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="viewMode" className="text-sm font-medium">
              {viewMode === 'simple' ? 'Simple Mode' : 'Normal Mode'}
            </Label>
            <Switch
              id="viewMode"
              checked={viewMode === 'normal'}
              onCheckedChange={(checked) => setViewMode(checked ? 'normal' : 'simple')}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {viewMode === 'simple' ? (
              <>
                {/* Simple Mode - Client Information */}
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
                    
                    <div>
                      <Label htmlFor="clientPhone">Client Phone Number *</Label>
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="0821234567, 27821234567, or +27821234567"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter in any format: 062..., 27..., or +27...
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="simpleAmount">Amount *</Label>
                      <Input
                        id="simpleAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={simpleAmount || ''}
                        onChange={(e) => setSimpleAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Simple Mode - WhatsApp Toggle */}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Must be in E.164 format (e.g., +27821234567)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                {/* Normal Mode - Client Information */}
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
                    <Label htmlFor="clientPhone">Client Phone Number *</Label>
                    <Input
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="0821234567, 27821234567, or +27821234567"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter in any format: 062..., 27..., or +27...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deliveryMethod">Delivery Method</Label>
                  <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Local Pickup">Local Pickup</SelectItem>
                      <SelectItem value="Courier Guy">Courier Guy</SelectItem>
                      <SelectItem value="Pargo">Pargo</SelectItem>
                      <SelectItem value="Door-to-Door">Door-to-Door</SelectItem>
                      <SelectItem value="PostNet">PostNet</SelectItem>
                      <SelectItem value="FastWay">FastWay</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {deliveryMethod !== 'Local Pickup' && (
                  <>
                    <div>
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter delivery address"
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="deliveryDate">Expected Delivery Date</Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="deliveryFee">Delivery Fee</Label>
                        <Input
                          id="deliveryFee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                  <Textarea
                    id="deliveryNotes"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Special delivery instructions or notes..."
                    rows={2}
                  />
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
                {/* Auto-populate payment options from settings */}
                {profile?.snapscan_link && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showSnapScan"
                      checked={showSnapScan}
                      onCheckedChange={(checked) => setShowSnapScan(!!checked)}
                    />
                    <Label htmlFor="showSnapScan">Show SnapScan Payment Button</Label>
                    <Badge variant="outline" className="text-xs text-green-600">
                      Configured
                    </Badge>
                  </div>
                )}
                
                {profile?.show_payfast_auto && profile?.payfast_merchant_id && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showPayFast"
                      checked={showPayFast}
                      onCheckedChange={(checked) => setShowPayFast(!!checked)}
                    />
                    <Label htmlFor="showPayFast">Show PayFast Payment Button</Label>
                    <Badge variant="outline" className="text-xs text-green-600">
                      Configured
                    </Badge>
                  </div>
                )}

                {profile?.show_capitec && profile?.capitec_paylink && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showCapitec"
                      checked={false}
                      onCheckedChange={() => {}}
                    />
                    <Label htmlFor="showCapitec">Show Capitec Pay Me Button</Label>
                    <Badge variant="outline" className="text-xs text-green-600">
                      Configured
                    </Badge>
                  </div>
                )}

                {!profile?.snapscan_link && !profile?.show_payfast_auto && !profile?.show_capitec && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      To show payment options on invoices, please set them up in Settings → Payment Settings.
                    </p>
                  </div>
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
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Add Products - Only in Normal Mode */}
            {viewMode === 'normal' && products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Add Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground">R{product.price}</p>
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
                {viewMode === 'simple' ? (
                  <>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>R{simpleAmount.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>R{(calculateSubtotal() - deliveryFee).toFixed(2)}</span>
                    </div>
                    
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>R{deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    
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
                  </>
                )}
                
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

      <CompletionPopup
        isOpen={showCompletionPopup}
        onClose={() => setShowCompletionPopup(false)}
        title="First Invoice Created!"
        message="Click the dashboard button to complete the rest of the steps"
      />
    </Layout>
  );
};

export default InvoiceBuilder;
