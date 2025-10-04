import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import OnboardingChoiceStep from '@/components/onboarding/steps/OnboardingChoice';
import { OnboardingChoice as OnboardingChoiceType } from '@/components/onboarding/NewOnboardingContainer';

const OnboardingChoicePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChoice = async (choice: OnboardingChoiceType) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ onboarding_choice: choice })
        .eq('id', user.id);

      // Navigate to next step based on choice
      if (choice === 'bookings') {
        navigate('/onboarding/availability');
      } else {
        navigate('/onboarding/product');
      }
    } catch (error) {
      console.error('Error updating choice:', error);
    }
  };

  return (
    <OnboardingLayout progress={25}>
      <OnboardingChoiceStep onChoice={handleChoice} />
    </OnboardingLayout>
  );
};

export default OnboardingChoicePage;