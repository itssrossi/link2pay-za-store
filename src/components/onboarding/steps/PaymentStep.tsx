import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';

interface PaymentStepProps {
  onNext: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  isOptional: boolean;
}

interface PaymentForm {
  eftDetails: string;
  payfastLink: string;
  snapscanLink: string;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onNext, state, setState, isOptional }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<PaymentForm>({
    eftDetails: '',
    payfastLink: '',
    snapscanLink: ''
  });

  useEffect(() => {
    loadExistingPayments();
  }, [user]);

  const loadExistingPayments = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('eft_details, payfast_link, snapscan_link')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setPayment({
          eftDetails: profile.eft_details || '',
          payfastLink: profile.payfast_link || '',
          snapscanLink: profile.snapscan_link || ''
        });
      }
    } catch (error) {
      console.error('Error loading payment info:', error);
    }
  };

  const handleInputChange = (field: keyof PaymentForm, value: string) => {
    setPayment(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          eft_details: payment.eftDetails,
          payfast_link: payment.payfastLink,
          snapscan_link: payment.snapscanLink
        })
        .eq('id', user.id);

      if (error) throw error;

      setState(prev => ({ ...prev, hasPayments: true }));
      toast.success('Payment information saved successfully!');
      onNext();
    } catch (error) {
      console.error('Error saving payment info:', error);
      toast.error('Failed to save payment information');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onNext();
  };

  const hasAnyPaymentInfo = payment.eftDetails || payment.payfastLink || payment.snapscanLink;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Payment Information
        </h2>
        <p className="text-gray-600">
          Set up payment methods to accept payments from your customers.
        </p>
        {isOptional && state.choice === 'bookings' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Automatic payments can be setup later via PayFast in Bookings settings.
              </p>
            </div>
          </div>
        )}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="eftDetails">Bank Details (EFT)</Label>
            <Textarea
              id="eftDetails"
              value={payment.eftDetails}
              onChange={(e) => handleInputChange('eftDetails', e.target.value)}
              placeholder="Bank: ABC Bank&#10;Account Name: Your Business Name&#10;Account Number: 1234567890&#10;Branch Code: 123456"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Customers will see these details for direct bank transfers
            </p>
          </div>

          <div>
            <Label htmlFor="payfastLink">PayFast Payment Link</Label>
            <Input
              id="payfastLink"
              value={payment.payfastLink}
              onChange={(e) => handleInputChange('payfastLink', e.target.value)}
              placeholder="https://payfast.co.za/eng/recurring/your-link"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your PayFast payment link for card payments
            </p>
          </div>

          <div>
            <Label htmlFor="snapscanLink">SnapScan QR Code Link</Label>
            <Input
              id="snapscanLink"
              value={payment.snapscanLink}
              onChange={(e) => handleInputChange('snapscanLink', e.target.value)}
              placeholder="https://pos.snapscan.co.za/qr/your-code"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your SnapScan QR code link for mobile payments
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        {isOptional && (
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={saving}
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Skip for Now
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || (!isOptional && !hasAnyPaymentInfo)}
          size="lg"
          className="min-w-40"
        >
          {saving ? 'Saving...' : hasAnyPaymentInfo ? 'Save & Continue' : 'Continue'}
        </Button>
      </div>
      
      {!isOptional && !hasAnyPaymentInfo && (
        <p className="text-sm text-red-500 text-center">
          Please add at least one payment method to continue
        </p>
      )}
    </div>
  );
};

export default PaymentStep;