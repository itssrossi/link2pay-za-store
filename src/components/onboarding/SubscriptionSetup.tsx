
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionSetupProps {
  trialEndsAt: string;
  onComplete: () => void;
}

const SubscriptionSetup = ({ trialEndsAt, onComplete }: SubscriptionSetupProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (data && data.code === 'BETA50') {
        setPromoApplied(true);
        setDiscountAmount(data.discount_amount);
        toast.success('Promo code applied! R45 discount applied.');
      } else {
        toast.error('Invalid promo code');
      }
    } catch (error) {
      toast.error('Invalid promo code');
    }
  };

  const setupSubscription = async () => {
    if (!billingDetails.name || !billingDetails.email) {
      toast.error('Please fill in all billing details');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('payfast-subscribe', {
        body: {
          promoCode: promoApplied ? promoCode : null,
          billingDetails
        }
      });

      if (error) throw error;

      // Create PayFast form and submit
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.payfastUrl;
      form.target = '_blank';

      Object.entries(data.formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      toast.success('Billing setup complete! Your 7-day trial has started.');
      onComplete();

    } catch (error) {
      console.error('Subscription setup error:', error);
      toast.error('Failed to setup subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const trialDaysLeft = 7;
  const finalPrice = promoApplied ? 50 : 95;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle>Start Your 7-Day Free Trial</CardTitle>
        <p className="text-sm text-gray-600">
          Setup billing to start your free trial. You'll only be charged after {trialDaysLeft} days.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">After Trial (Monthly)</span>
            <div className="text-right">
              {promoApplied && (
                <div className="text-sm text-gray-500 line-through">R95.00</div>
              )}
              <div className="font-bold text-lg">R{finalPrice}.00</div>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">
            Free for {trialDaysLeft} days - Cancel anytime
          </div>
          {promoApplied && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 mt-2">
              <Zap className="w-3 h-3 mr-1" />
              BETA50 Applied - R45 Off!
            </Badge>
          )}
        </div>

        {/* Promo Code */}
        {!promoApplied && (
          <div className="space-y-2">
            <Label htmlFor="promo">Promo Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="promo"
                placeholder="Enter BETA50 for discount"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <Button variant="outline" onClick={validatePromoCode}>
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Billing Details */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={billingDetails.name}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={billingDetails.email}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2">What's included:</h4>
          <ul className="text-xs space-y-1">
            <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-600" />Unlimited products & invoices</li>
            <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-600" />WhatsApp automation</li>
            <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-600" />Custom store design</li>
            <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-600" />PayFast payments</li>
          </ul>
        </div>

        <Button 
          onClick={setupSubscription} 
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? 'Setting up...' : `Start Free Trial`}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Secure payment processing by PayFast. Cancel anytime during your trial.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSetup;
