import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import PaymentStep from '@/components/onboarding/steps/PaymentStep';
import { OnboardingState, OnboardingChoice } from '@/components/onboarding/NewOnboardingContainer';

const PaymentSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    choice: null,
    currentStep: 3,
    hasProducts: false,
    hasAvailability: false,
    hasPayments: false,
    storeHandle: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_choice, store_handle')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setState(prev => ({
          ...prev,
          choice: profile.onboarding_choice as OnboardingChoice || null,
          storeHandle: profile.store_handle || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleNext = () => {
    navigate('/onboarding/success');
  };

  const getBackTo = () => {
    if (state.choice === 'bookings') {
      return '/onboarding/availability';
    } else {
      return '/onboarding/product';
    }
  };

  return (
    <OnboardingLayout progress={90} showBackButton backTo={getBackTo()}>
      <PaymentStep
        onNext={handleNext}
        state={state}
        setState={setState}
        isOptional={true}
      />
    </OnboardingLayout>
  );
};

export default PaymentSetupPage;