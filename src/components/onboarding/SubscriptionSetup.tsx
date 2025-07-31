import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionSetupProps {
  trialEndsAt: string;
  onComplete: () => void;
}

const SubscriptionSetup = ({ trialEndsAt, onComplete }: SubscriptionSetupProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    fullName: '',
    email: '',
  });

  // Load user email on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setBillingDetails(prev => ({ ...prev, email: user.email! }));
      }
    };
    loadUserData();
  }, []);

  // Calculate pricing
  const basePrice = 95;
  const finalPrice = basePrice - discount;
  const formattedTrialEnd = new Date(trialEndsAt).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setDiscount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid promo code');
        setDiscount(0);
        return;
      }

      setDiscount(data.discount_amount);
      toast.success(`Promo code applied! R${data.discount_amount} discount`);
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Error validating promo code');
      setDiscount(0);
    }
  };

  const setupSubscription = async () => {
    if (!billingDetails.fullName || !billingDetails.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Call our Supabase function to initialize Paystack payment
      const { data, error } = await supabase.functions.invoke('paystack-create-subscription', {
        body: {
          email: billingDetails.email,
          fullName: billingDetails.fullName,
          promoCode: promoCode || null,
        },
      });

      if (error) {
        console.error('Subscription setup error:', error);
        
        // Provide specific error messages for common issues
        if (error.message?.includes('Paystack secret key not configured')) {
          toast.error('Payment system is not configured. Please contact support.');
        } else if (error.message?.includes('Authentication failed')) {
          toast.error('Authentication error. Please try logging out and back in.');
        } else if (error.message?.includes('Trial has already been used')) {
          toast.error('You have already used your free trial. Please contact support if you need assistance.');
        } else if (error.message?.includes('Failed to create customer')) {
          toast.error('Unable to create customer account. Please check your email address and try again.');
        } else if (error.message?.includes('Failed to create plan') || error.message?.includes('Failed to initialize payment')) {
          toast.error('Payment setup failed. Please try again or contact support.');
        } else {
          toast.error(error.message || 'Failed to setup subscription. Please try again.');
        }
        return;
      }

      if (!data?.success) {
        console.error('Subscription creation failed:', data);
        
        // Handle specific errors from the response
        if (data?.error?.includes('Paystack secret key not configured')) {
          toast.error('Payment system is not configured. Please contact support.');
        } else if (data?.error?.includes('Trial has already been used')) {
          toast.error('You have already used your free trial. Please contact support if you need assistance.');
        } else {
          toast.error(data?.error || 'Failed to setup subscription. Please try again.');
        }
        return;
      }

      // Redirect to Paystack checkout
      if (data.checkout_url) {
        toast.success('Redirecting to payment...');
        window.location.href = data.checkout_url;
      } else {
        toast.error('Failed to get payment URL. Please try again.');
      }

    } catch (error) {
      console.error('Subscription setup error:', error);
      
      // Handle network or other unexpected errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle>Start Your 7-Day Free Trial</CardTitle>
        <p className="text-sm text-gray-600">
          Setup your subscription to start your free trial. You'll only be charged after {formattedTrialEnd}.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">After Trial (Monthly)</span>
            <div className="text-right">
              {discount > 0 && (
                <div className="text-sm text-gray-500 line-through">R{basePrice}.00</div>
              )}
              <div className="font-bold text-lg">R{finalPrice}.00</div>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">
            Free for 7 days - Cancel anytime
          </div>
        </div>

        {/* Promo Code */}
        {discount === 0 && (
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
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={billingDetails.fullName}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={billingDetails.email}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email address"
              required
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">What you'll get:</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Unlimited products & invoices</li>
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />WhatsApp automation</li>
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Custom store design</li>
            <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-green-600" />Paystack payment processing</li>
          </ul>
        </div>

        <Button 
          onClick={setupSubscription} 
          disabled={loading || !billingDetails.fullName || !billingDetails.email}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating subscription...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Start 7-Day Free Trial - R{finalPrice}/month after
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Secure payment processing by Paystack. No charge during trial period.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionSetup;