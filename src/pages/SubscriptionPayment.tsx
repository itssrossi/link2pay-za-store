import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CreditCard, Tag, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const SubscriptionPayment = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, isTrialActive, refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(95);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const basePrice = 95;

  // Redirect if user has active subscription or trial
  useEffect(() => {
    if (hasActiveSubscription || isTrialActive) {
      navigate('/dashboard');
    }
  }, [hasActiveSubscription, isTrialActive, navigate]);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setLoading(true);
    try {
      const { data: promoCodes, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promoCodes) {
        toast.error('Invalid or expired promo code');
        setPromoApplied(false);
        setDiscountAmount(0);
        setFinalPrice(basePrice);
        return;
      }

      // Check if promo code has usage limits
      if (promoCodes.max_uses && promoCodes.current_uses >= promoCodes.max_uses) {
        toast.error('This promo code has reached its usage limit');
        setPromoApplied(false);
        setDiscountAmount(0);
        setFinalPrice(basePrice);
        return;
      }

      // Check expiry date
      if (promoCodes.expires_at && new Date(promoCodes.expires_at) < new Date()) {
        toast.error('This promo code has expired');
        setPromoApplied(false);
        setDiscountAmount(0);
        setFinalPrice(basePrice);
        return;
      }

      // Apply discount
      const discount = promoCodes.discount_amount;
      const newPrice = Math.max(0, basePrice - discount);
      
      setDiscountAmount(discount);
      setFinalPrice(newPrice);
      setPromoApplied(true);
      toast.success(`Promo code applied! R${discount} discount`);

    } catch (error) {
      console.error('Error validating promo code:', error);
      toast.error('Error validating promo code');
    } finally {
      setLoading(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoApplied(false);
    setDiscountAmount(0);
    setFinalPrice(basePrice);
    toast.info('Promo code removed');
  };

  const handlePaystackPayment = async () => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      return;
    }

    setProcessingPayment(true);
    try {
      // Call Paystack setup function with promo code if applied
      const { data, error } = await supabase.functions.invoke('paystack-setup-post-trial', {
        body: {
          email: user.email,
          fullName: user.user_metadata?.full_name || '',
          promoCode: promoApplied ? promoCode : null,
          finalAmount: finalPrice
        }
      });

      if (error) {
        console.error('Paystack setup error:', error);
        toast.error('Failed to setup payment. Please try again.');
        return;
      }

      console.log('Paystack response:', data);

      if (data.success && data.checkout_url) {
        // Redirect to Paystack checkout
        window.location.href = data.checkout_url;
      } else {
        console.error('No checkout URL in response:', data);
        toast.error(data.message || 'Failed to setup payment');
      }

    } catch (error) {
      console.error('Payment setup error:', error);
      toast.error('An error occurred while setting up payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Don't render if user has active subscription or trial
  if (hasActiveSubscription || isTrialActive) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Subscribe to Continue</CardTitle>
            <p className="text-sm text-gray-600">
              Your free trial has ended. Choose a subscription plan to continue using Link2Pay.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Plan */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Professional Plan</h3>
                <Badge variant="secondary">Most Popular</Badge>
              </div>
              <ul className="text-sm space-y-2 mb-4">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Unlimited products & invoices
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  WhatsApp automation
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Custom store design
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Paystack payment processing
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  Booking system
                </li>
              </ul>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  R{finalPrice}
                  <span className="text-lg font-normal text-gray-600">/month</span>
                </div>
                {promoApplied && discountAmount > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    <span className="line-through text-gray-500">R{basePrice}</span>
                    {' '}Save R{discountAmount}!
                  </div>
                )}
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="space-y-3">
              <Label htmlFor="promoCode" className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Have a promo code?
              </Label>
              <div className="flex gap-2">
                <Input
                  id="promoCode"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  disabled={promoApplied}
                  className={promoApplied ? 'bg-green-50 border-green-200' : ''}
                />
                {promoApplied ? (
                  <Button
                    onClick={removePromoCode}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={validatePromoCode}
                    variant="outline"
                    disabled={loading || !promoCode.trim()}
                    size="sm"
                  >
                    {loading ? '...' : 'Apply'}
                  </Button>
                )}
              </div>
              {promoApplied && (
                <div className="text-sm text-green-600 flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  Promo code "{promoCode}" applied successfully!
                </div>
              )}
            </div>

            {/* Payment Button */}
            <Button 
              onClick={handlePaystackPayment}
              className="w-full bg-green-600 hover:bg-green-700" 
              size="lg"
              disabled={processingPayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {processingPayment ? 'Setting up payment...' : `Subscribe for R${finalPrice}/month`}
            </Button>

            {/* Additional Info */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">
                Secure payment powered by Paystack
              </p>
              <p className="text-xs text-gray-500">
                Cancel anytime from your settings
              </p>
            </div>

            {/* Back to Dashboard */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPayment;