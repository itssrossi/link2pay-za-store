import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, X, Lightbulb } from 'lucide-react';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';
import { checkWeeklyInvoiceAchievement } from '@/utils/invoiceAchievements';

const InvoiceQuickStart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    whatsappNumber: '',
    amount: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTipPopup, setShowTipPopup] = useState(false);
  const [userWhatsAppNumber, setUserWhatsAppNumber] = useState<string>('');

  useEffect(() => {
    const fetchUserWhatsApp = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', user.id)
        .single();
      
      if (data?.whatsapp_number) {
        setUserWhatsAppNumber(data.whatsapp_number);
      }
    };
    
    fetchUserWhatsApp();
  }, [user]);

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on length and prefix
    if (digits.startsWith('27')) {
      return digits.slice(0, 11);
    } else if (digits.startsWith('0')) {
      return digits.slice(0, 10);
    }
    return digits.slice(0, 10);
  };

  const normalizePhoneForWhatsApp = (phone: string): string | null => {
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.startsWith('27') && digits.length === 11) {
      return `+${digits}`;
    } else if (digits.startsWith('0') && digits.length === 10) {
      return `+27${digits.slice(1)}`;
    } else if (digits.length === 9) {
      return `+27${digits}`;
    }
    
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    } else {
      const normalized = normalizePhoneForWhatsApp(formData.whatsappNumber);
      if (!normalized) {
        newErrors.whatsappNumber = 'Please enter a valid South African number';
      }
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Please enter a valid amount';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'whatsappNumber') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAutofillMyNumber = () => {
    if (userWhatsAppNumber) {
      handleInputChange('whatsappNumber', userWhatsAppNumber);
      setShowTipPopup(true);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const normalizedPhone = normalizePhoneForWhatsApp(formData.whatsappNumber);

      // Generate invoice number
      const { data: existingInvoices } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let invoiceNumber = 'INV-001';
      if (existingInvoices && existingInvoices.length > 0) {
        const lastNumber = parseInt(existingInvoices[0].invoice_number.split('-')[1]) || 0;
        invoiceNumber = `INV-${String(lastNumber + 1).padStart(3, '0')}`;
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: formData.customerName.trim(),
          client_phone: normalizedPhone,
          subtotal: amount,
          vat_amount: 0,
          total_amount: amount,
          delivery_method: 'Local Pickup',
          payment_enabled: true,
          status: 'pending',
          vat_enabled: false
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice item
      const { error: itemError } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoice.id,
          title: 'Service/Product',
          description: '',
          quantity: 1,
          unit_price: amount,
          total_price: amount
        });

      if (itemError) throw itemError;

      // Send WhatsApp message
      try {
        const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            phone: normalizedPhone,
            clientName: formData.customerName.trim(),
            amount: `R${amount.toFixed(2)}`,
            invoiceId: invoice.invoice_number,
            invoiceUrl: invoiceUrl,
            messageType: 'invoice'
          }
        });
      } catch (whatsappError) {
        console.error('WhatsApp send error:', whatsappError);
        // Don't fail the whole flow if WhatsApp fails
        toast.warning('Invoice created but WhatsApp message failed to send');
      }

      // Update first invoice tracking
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_invoice_sent_at')
        .eq('id', user.id)
        .single();

      if (profile && !profile.first_invoice_sent_at) {
        await supabase
          .from('profiles')
          .update({ 
            first_invoice_sent_at: new Date().toISOString(),
            glowing_invoice_tab: false,  // Disable glow since they used it
            tip_popup_shown: true         // Mark popup as shown
          })
          .eq('id', user.id);
        
        // Clear any pending localStorage flags
        localStorage.removeItem('invoiceGlowReady');
        localStorage.removeItem('tipPopupReady');
      }

      // Success!
      triggerConfetti();
      playCelebrationSound();
      toast.success('Invoice sent! Let\'s get you paid 💸');
      
      // Check for weekly achievement
      await checkWeeklyInvoiceAchievement(user.id);
      
      setTimeout(() => {
        navigate(`/invoice/${invoice.id}`);
      }, 1000);

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.customerName.trim() && 
                      formData.whatsappNumber.trim() && 
                      formData.amount.trim() &&
                      parseFloat(formData.amount) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your First Invoice</CardTitle>
          <p className="text-sm text-muted-foreground">
            Just 3 quick fields and you're done!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              placeholder="e.g. John Smith"
              value={formData.customerName}
              onChange={(e) => handleInputChange('customerName', e.target.value)}
              autoFocus
              className={errors.customerName ? 'border-red-500' : ''}
            />
            {errors.customerName && (
              <p className="text-xs text-red-500">{errors.customerName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
            <Input
              id="whatsappNumber"
              placeholder="e.g. 0821234567"
              value={formData.whatsappNumber}
              onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
              className={errors.whatsappNumber ? 'border-red-500' : ''}
            />
            {errors.whatsappNumber && (
              <p className="text-xs text-red-500">{errors.whatsappNumber}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter 10 digits (e.g. 0821234567)
            </p>
            {userWhatsAppNumber && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutofillMyNumber}
                className="w-full mt-2"
              >
                Use My Number
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Sending...' : 'Send Invoice'}
          </Button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </CardContent>
      </Card>

      {/* Tip Popup */}
      {showTipPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowTipPopup(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Quick Tip!</CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Send it to yourself and see how simple it is! 💡
              </p>
              <Button
                onClick={() => setShowTipPopup(false)}
                className="w-full"
              >
                Got it!
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvoiceQuickStart;
