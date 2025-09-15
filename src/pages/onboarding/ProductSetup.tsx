import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import ProductStep from '@/components/onboarding/steps/ProductStep';
import { OnboardingState, OnboardingChoice } from '@/components/onboarding/NewOnboardingContainer';

const ProductSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    choice: 'physical_products',
    currentStep: 2,
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
          choice: profile.onboarding_choice as OnboardingChoice || 'physical_products',
          storeHandle: profile.store_handle || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleNext = () => {
    navigate('/onboarding/payment');
  };

  return (
    <OnboardingLayout progress={75} showBackButton backTo="/onboarding/logo">
      <ProductStep
        onNext={handleNext}
        state={state}
        setState={setState}
        isOptional={false}
      />
    </OnboardingLayout>
  );
};

export default ProductSetupPage;