import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import md5 from 'blueimp-md5';

const generatePayFastSubscriptionLink = ({
  name,
  email,
  invoiceId,
  promo
}: { name: string; email: string; invoiceId: string; promo?: string; }) => {
  const billingAmount = promo?.toUpperCase() === 'BETA50' ? '95.00' : promo?.toUpperCase() === 'BETA5' ? '5.00' : '152.00';
  const billingDate = new Date().toISOString().split('T')[0];

  const data: Record<string, string> = {
    merchant_id: '18305104',
    merchant_key: 'kse495ugy7ekz',
    return_url: `${window.location.origin}/billing/success`,
    cancel_url: `${window.location.origin}/billing/cancelled`,
    notify_url: 'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/payfast-notify',
    name_first: name.trim(),
    email_address: email.trim(),
    m_payment_id: invoiceId,
    amount: billingAmount,
    item_name: 'Link2Pay Subscription',
    subscription_type: '1',
    billing_date: billingDate,
    recurring_amount: billingAmount,
    frequency: '3',
    cycles: '0'
  };

  const fieldOrder = [
    'merchant_id','merchant_key','return_url','cancel_url','notify_url',
    'name_first','email_address','m_payment_id','amount','item_name',
    'subscription_type','billing_date','recurring_amount','frequency','cycles'
  ];

  let signatureString = '';
  for (const key of fieldOrder) {
    if (data[key]) {
      signatureString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  }
  signatureString += `passphrase=${encodeURIComponent('Bonbon123123').replace(/%20/g, '+')}`;

  const signature = md5(signatureString).toLowerCase();

  const url = new URL('https://www.payfast.co.za/eng/process');
  Object.entries(data).forEach(([k, v]) => url.searchParams.append(k, v));
  url.searchParams.append('signature', signature);

  return url.toString();
};




const BillingSetup = () => {
  const { user } = useAuth();
  const { refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    business_name: '',
    promo: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Pre-fill form with user data
    const loadUserData = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.full_name || '',
          email: user.email || '',
          business_name: profile.business_name || ''
        }));
      }
    };

    loadUserData();
  }, [user, navigate]);

  // Handle success/cancellation from PayFast
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('Subscription activated successfully!');
      navigate('/dashboard');
    } else if (status === 'cancelled') {
      toast.error('Subscription setup was cancelled.');
    }
  }, [searchParams, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Handle DEVJOHN promo code first - activate unlimited trial (bypass validation)
      if (formData.promo?.toUpperCase() === 'DEVJOHN') {
        console.log('Processing DEVJOHN promo code for user:', user?.id);
        
        // Check if profile exists first
        const { data: existingProfile, error: selectError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user?.id)
          .maybeSingle();

        if (selectError) {
          console.error('DEVJOHN select error:', selectError);
          throw selectError;
        }

        const profileData = {
          full_name: formData.name || user?.email?.split('@')[0] || 'Developer',
          business_name: formData.business_name || 'Developer Business',
          whatsapp_number: '+27000000000', // Placeholder to satisfy any constraints
          subscription_status: 'active',
          has_active_subscription: true,
          trial_expired: false,
          trial_ends_at: null, // No expiry date for unlimited trial
          subscription_amount: 0,
          discount_applied: true,
          onboarding_completed: true
        };

        if (existingProfile) {
          // Update existing profile
          console.log('Updating existing profile for DEVJOHN');
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user?.id);

          if (updateError) {
            console.error('DEVJOHN update error:', updateError);
            throw updateError;
          }
        } else {
          // Insert new profile
          console.log('Creating new profile for DEVJOHN');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user?.id,
              ...profileData
            });

          if (insertError) {
            console.error('DEVJOHN insert error:', insertError);
            throw insertError;
          }
        }

        console.log('DEVJOHN profile processed successfully');
        
        // Set bypass flag to prevent redirect loop
        localStorage.setItem('devjohn_bypass', Date.now().toString());
        
        // Refresh subscription context to reflect changes
        console.log('Refreshing subscription context...');
        await refreshSubscription();
        
        toast.success('Developer account activated! Welcome to Link2Pay.');
        setLoading(false);
        
        // Small delay to ensure state updates propagate
        setTimeout(() => {
          console.log('Navigating to dashboard...');
          navigate('/dashboard');
        }, 100);
        return;
      }

      // Check required fields for regular billing setup
      if (!formData.name || !formData.email || !formData.business_name) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Generate unique invoice ID
      const invoiceId = `sub-${Date.now()}-${user?.id}`;

      // Generate PayFast URL
      const payFastUrl = generatePayFastSubscriptionLink({
        name: formData.name,
        email: formData.email,
        invoiceId,
        promo: formData.promo
      });

      // Redirect to PayFast
      window.open(payFastUrl, '_blank', 'noopener,noreferrer');
      
      // Update user profile with billing info
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          business_name: formData.business_name,
          subscription_amount: formData.promo?.toUpperCase() === 'BETA50' ? 95 : formData.promo?.toUpperCase() === 'BETA5' ? 5 : 152,
          discount_applied: formData.promo?.toUpperCase() === 'BETA50' || formData.promo?.toUpperCase() === 'BETA5'
        })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }


    } catch (error) {
      console.error('Error setting up billing:', error);
      toast.error('Failed to setup billing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const billingAmount = formData.promo?.toUpperCase() === 'BETA50' ? 95 : formData.promo?.toUpperCase() === 'BETA5' ? 5 : 152;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Skip for now
          </Button>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Setup Billing</CardTitle>
            <p className="text-gray-600">
              Continue using Link2Pay with a monthly subscription
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="promo">Promo Code (optional)</Label>
                <Input
                  id="promo"
                  type="text"
                  value={formData.promo}
                  onChange={(e) => handleInputChange('promo', e.target.value)}
                  placeholder="Enter promo code"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Subscription Details:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly subscription:</span>
                    <span className={formData.promo?.toUpperCase() === 'BETA50' || formData.promo?.toUpperCase() === 'BETA5' ? 'line-through text-gray-500' : ''}>
                      R152.00
                    </span>
                  </div>
                  {formData.promo?.toUpperCase() === 'BETA50' && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>BETA50 discount:</span>
                      <span>R95.00</span>
                    </div>
                  )}
                  {formData.promo?.toUpperCase() === 'BETA5' && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>BETA5 discount:</span>
                      <span>R5.00</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R{billingAmount}.00/month</span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {loading ? 'Setting up...' : `Subscribe for R${billingAmount}/month`}
              </Button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment processing via PayFast
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSetup;