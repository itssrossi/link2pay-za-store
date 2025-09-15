import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import OnboardingChoice from './steps/OnboardingChoice';
import LogoUploadStep from './steps/LogoUploadStep';
import AvailabilityStep from './steps/AvailabilityStep';
import ProductStep from './steps/ProductStep';
import PaymentStep from './steps/PaymentStep';
import SuccessStep from './steps/SuccessStep';

export type OnboardingChoice = 'physical_products' | 'bookings';

export interface OnboardingState {
  choice: OnboardingChoice | null;
  currentStep: number;
  logoUrl?: string;
  hasProducts: boolean;
  hasAvailability: boolean;
  hasPayments: boolean;
  storeHandle: string;
}

interface NewOnboardingContainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewOnboardingContainer: React.FC<NewOnboardingContainerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    choice: null,
    currentStep: 0,
    hasProducts: false,
    hasAvailability: false,
    hasPayments: false,
    storeHandle: ''
  });

  useEffect(() => {
    if (user && isOpen) {
      loadInitialData();
    }
  }, [user, isOpen]);

  const loadInitialData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('store_handle, onboarding_choice')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setState(prev => ({
          ...prev,
          storeHandle: profile.store_handle || '',
          choice: profile.onboarding_choice as OnboardingChoice || null
        }));
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const updateChoice = async (choice: OnboardingChoice) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ onboarding_choice: choice })
        .eq('id', user.id);

      setState(prev => ({ ...prev, choice, currentStep: 1 }));
    } catch (error) {
      console.error('Error updating choice:', error);
    }
  };

  const nextStep = () => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      onClose();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (!isOpen) return null;

  const getSteps = () => {
    if (!state.choice) return [];
    
    if (state.choice === 'bookings') {
      return [
        { component: LogoUploadStep, title: 'Upload Logo', optional: true },
        { component: AvailabilityStep, title: 'Set Availability', optional: false },
        { component: PaymentStep, title: 'Payment Info', optional: true },
        { component: SuccessStep, title: 'Success', optional: false }
      ];
    } else {
      return [
        { component: LogoUploadStep, title: 'Upload Logo', optional: true },
        { component: ProductStep, title: 'Add Product', optional: false },
        { component: PaymentStep, title: 'Payment Info', optional: false },
        { component: SuccessStep, title: 'Success', optional: false }
      ];
    }
  };

  const renderCurrentStep = () => {
    if (state.currentStep === 0) {
      return <OnboardingChoice onChoice={updateChoice} />;
    }

    const steps = getSteps();
    const currentStepIndex = state.currentStep - 1;
    
    if (currentStepIndex >= steps.length) {
      return null;
    }

    const StepComponent = steps[currentStepIndex].component;
    const stepProps = {
      onNext: nextStep,
      onComplete: completeOnboarding,
      state,
      setState,
      isOptional: steps[currentStepIndex].optional
    };

    return <StepComponent {...stepProps} />;
  };

  const steps = getSteps();
  const totalSteps = steps.length + 1; // +1 for choice step
  const progress = (state.currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[90vw] sm:max-w-lg md:max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-primary h-2 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="p-4 sm:p-6 lg:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 lg:pb-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default NewOnboardingContainer;