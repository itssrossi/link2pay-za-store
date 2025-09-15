import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import SuccessStep from '@/components/onboarding/steps/SuccessStep';
import { OnboardingState, OnboardingChoice } from '@/components/onboarding/NewOnboardingContainer';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    choice: null,
    currentStep: 4,
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

  const handleComplete = async () => {
    if (!user) return;

    try {
      // Mark onboarding as complete
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <OnboardingLayout progress={100}>
      <SuccessStep
        onComplete={handleComplete}
        state={state}
        setState={setState}
      />
    </OnboardingLayout>
  );
};

export default SuccessPage;