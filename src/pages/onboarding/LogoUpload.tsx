import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import LogoUploadStep from '@/components/onboarding/steps/LogoUploadStep';
import { OnboardingState, OnboardingChoice } from '@/components/onboarding/NewOnboardingContainer';

const LogoUploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    choice: null,
    currentStep: 1,
    hasProducts: false,
    hasAvailability: false,
    hasPayments: false,
    storeHandle: ''
  });

  useEffect(() => {
    if (user) {
      loadUserChoice();
    }
  }, [user]);

  const loadUserChoice = async () => {
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
      console.error('Error loading user choice:', error);
    }
  };

  const handleNext = () => {
    if (state.choice === 'bookings') {
      navigate('/onboarding/availability');
    } else {
      navigate('/onboarding/product');
    }
  };

  return (
    <OnboardingLayout progress={50} showBackButton backTo="/onboarding/choice">
      <LogoUploadStep
        onNext={handleNext}
        state={state}
        setState={setState}
        isOptional={true}
      />
    </OnboardingLayout>
  );
};

export default LogoUploadPage;