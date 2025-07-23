
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, ArrowLeft, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BillingSetup = () => {
  const { user } = useAuth();
  const { setNeedsBillingSetup, setShowOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isDevCode, setIsDevCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const { data } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (data) {
        if (data.code === 'BETA50') {
          setPromoApplied(true);
          setIsDevCode(false);
          setDiscountAmount(data.discount_amount);
          toast.success('Promo code applied! R45 discount applied.');
        } else if (data.code === 'DEVJOHN') {
          setPromoApplied(true);
          setIsDevCode(true);
          setDiscountAmount(95);
          toast.success('Developer code applied! Full access granted.');
        }
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

      // Handle developer account response
      if (data.devAccount) {
        toast.success(data.message);
        
        // Update context state immediately
        setNeedsBillingSetup(false);
        setShowOnboarding(true);
        
        // Navigate to dashboard
        navigate('/dashboard');
        return;
      }

      // Create PayFast form and submit for regular accounts
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
      navigate('/dashboard');

    } catch (error) {
      console.error('Subscription setup error:', error);
      toast.error('Failed to setup subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const trialDaysLeft = 7;
  const finalPrice = isDevCode ? 0 : (promoApplied ? 50 : 95);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isDevCode ? (
                <Crown className="w-8 h-8 text-yellow-600" />
              ) : (
                <CreditCard className="w-8 h-8 text-green-600" />
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              {isDevCode ? 'Developer Access' : 'Start Your 7-Day Free Trial'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              {isDevCode 
                ? 'Welcome developer! You have full access to all features.'
                : `Setup billing to start your free trial. You'll only be charged after ${trialDaysLeft} days.`
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {isDevCode ? 'Developer Account' : 'After Trial (Monthly)'}
                </span>
                <div className="text-right">
                  {promoApplied && !isDevCode && (
                    <div className="text-sm text-gray-500 line-through">R95.00</div>
                  )}
                  <div className="font-bold text-lg">
                    {isDevCode ? 'FREE' : `R${finalPrice}.00`}
                  </div>
                </div>
              </div>
              <div className="text-sm text-green-600 font-medium">
                {isDevCode 
                  ? 'Full access - No charges ever'
                  : `Free for ${trialDaysLeft} days - Cancel anytime`
                }
              </div>
              {promoApplied && (
                <Badge variant="secondary" className={`mt-2 ${
                  isDevCode 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isDevCode ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Developer Access Granted!
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 mr-1" />
                      BETA50 Applied - R45 Off!
                    </>
                  )}
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
                    placeholder="Enter promo code"
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

            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button 
                onClick={setupSubscription} 
                disabled={loading}
                className={`flex-1 ${
                  isDevCode 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Setting up...' : (isDevCode ? 'Activate Account' : 'Start Trial')}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              {isDevCode 
                ? 'Developer account - No payment required'
                : 'Secure payment processing by PayFast. Cancel anytime during your trial.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSetup;
