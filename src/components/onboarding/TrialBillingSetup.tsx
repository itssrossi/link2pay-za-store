
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, Crown, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TrialBillingSetupProps {
  onComplete: () => void;
}

const TrialBillingSetup = ({ onComplete }: TrialBillingSetupProps) => {
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isDevCode, setIsDevCode] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

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

  const setupTrialWithBilling = async () => {
    if (!billingDetails.name || !billingDetails.email) {
      toast.error('Please fill in all billing details');
      return;
    }

    setLoading(true);

    try {
      // Call the updated PayFast subscription function for trial setup
      const { data, error } = await supabase.functions.invoke('payfast-subscribe', {
        body: {
          promoCode: promoApplied ? promoCode : null,
          billingDetails,
          isTrialSetup: true // New flag to indicate this is trial setup
        }
      });

      if (error) throw error;

      // Handle developer account response
      if (data.devAccount) {
        toast.success(data.message);
        onComplete();
        return;
      }

      // Create PayFast form and submit for tokenization
      if (data.success && data.payfastUrl && data.formData) {
        setRedirecting(true);
        toast.success('Redirecting to PayFast to setup billing...');
        
        // Wait a moment to show the redirecting message
        setTimeout(() => {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.payfastUrl;
          
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
        }, 1500);
      } else {
        throw new Error('Invalid response from payment service');
      }

    } catch (error) {
      console.error('Trial billing setup error:', error);
      
      // Try to get more specific error details
      let errorMessage = 'Failed to setup billing. Please try again.';
      if (error.message) {
        errorMessage = `Billing setup failed: ${error.message}`;
      }
      
      toast.error(errorMessage);
      setRedirecting(false);
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = isDevCode ? 0 : (promoApplied ? 50 : 95);

  if (redirecting) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
          <h3 className="text-lg font-semibold mb-2">Setting up billing...</h3>
          <p className="text-gray-600">
            Redirecting to PayFast to securely collect your billing information...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {isDevCode ? (
            <Crown className="w-8 h-8 text-yellow-600" />
          ) : (
            <CreditCard className="w-8 h-8 text-green-600" />
          )}
        </div>
        <CardTitle>
          {isDevCode ? 'Developer Access' : 'Start Your Free Trial'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {isDevCode 
            ? 'Welcome developer! You have full access to all features.'
            : 'Setup billing information now to activate your 7-day free trial.'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial Info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">7-Day Free Trial</span>
          </div>
          <p className="text-sm text-blue-700">
            {isDevCode 
              ? 'No charges - full access forever'
              : `You won't be charged until your trial ends in 7 days. After that, you'll be charged R${finalPrice} monthly.`
            }
          </p>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">After Trial (Monthly)</span>
            <div className="text-right">
              {promoApplied && !isDevCode && (
                <div className="text-sm text-gray-500 line-through">R95.00</div>
              )}
              <div className="font-bold text-lg">
                {isDevCode ? 'FREE' : `R${finalPrice}.00`}
              </div>
            </div>
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

        <Button 
          onClick={setupTrialWithBilling} 
          disabled={loading || redirecting}
          className={`w-full ${
            isDevCode 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            isDevCode ? 'Activate Account' : 'Start Free Trial'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          {isDevCode 
            ? 'Developer account - No payment required'
            : 'Secure billing setup by PayFast. Your trial starts immediately after billing setup.'
          }
        </p>
      </CardContent>
    </Card>
  );
};

export default TrialBillingSetup;
