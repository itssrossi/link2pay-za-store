
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import TrialBillingSetup from '@/components/onboarding/TrialBillingSetup';

const BillingSetup = () => {
  const { user } = useAuth();
  const { setNeedsBillingSetup, setShowOnboarding } = useOnboarding();
  const { refreshSubscription } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for trial success/cancellation on page load
  useEffect(() => {
    const trialStatus = searchParams.get('trial');
    
    if (trialStatus === 'success') {
      console.log('Trial setup successful, refreshing subscription status...');
      setShowSuccessMessage(true);
      
      // Refresh subscription status after a short delay to allow webhook processing
      setTimeout(async () => {
        await refreshSubscription();
        toast.success('Trial billing setup complete! Your 7-day trial is now active.');
        
        // Navigate to dashboard after showing success
        setTimeout(() => {
          handleBillingComplete();
        }, 2000);
      }, 1000);
      
    } else if (trialStatus === 'cancelled') {
      toast.error('Trial setup was cancelled. You can try again or skip for now.');
    }
  }, [searchParams, refreshSubscription]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleBillingComplete = () => {
    // Update context state
    setNeedsBillingSetup(false);
    setShowOnboarding(true);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  // Show success message if returning from PayFast
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Trial Setup Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your billing information has been securely saved and your 7-day free trial is now active.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        
        <TrialBillingSetup onComplete={handleBillingComplete} />
      </div>
    </div>
  );
};

export default BillingSetup;
