
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TrialBillingSetup from '@/components/onboarding/TrialBillingSetup';

const BillingSetup = () => {
  const { user } = useAuth();
  const { setNeedsBillingSetup, setShowOnboarding } = useOnboarding();
  const navigate = useNavigate();

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
