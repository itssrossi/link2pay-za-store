
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingFlowContextType {
  showOnboardingFlow: boolean;
  currentStep: number;
  onboardingData: {
    businessName: string;
    whatsappNumber: string;
    logoUrl: string;
    paymentMethod: 'snapscan' | 'payfast' | 'eft' | '';
    paymentDetails: string;
  };
  setCurrentStep: (step: number) => void;
  updateOnboardingData: (data: Partial<OnboardingFlowContextType['onboardingData']>) => void;
  completeOnboardingFlow: () => Promise<void>;
  showOverlayTutorial: boolean;
  setShowOverlayTutorial: (show: boolean) => void;
  overlayStep: number;
  setOverlayStep: (step: number) => void;
  startOverlayTutorial: () => void;
}

const OnboardingFlowContext = createContext<OnboardingFlowContextType | undefined>(undefined);

export const useOnboardingFlow = () => {
  const context = useContext(OnboardingFlowContext);
  if (context === undefined) {
    throw new Error('useOnboardingFlow must be used within an OnboardingFlowProvider');
  }
  return context;
};

export const OnboardingFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [showOnboardingFlow, setShowOnboardingFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOverlayTutorial, setShowOverlayTutorial] = useState(false);
  const [overlayStep, setOverlayStep] = useState(1);
  
  const [onboardingData, setOnboardingData] = useState({
    businessName: '',
    whatsappNumber: '',
    logoUrl: '',
    paymentMethod: '' as 'snapscan' | 'payfast' | 'eft' | '',
    paymentDetails: ''
  });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, onboarding_completed')
          .eq('id', user.id)
          .single();

        // Show onboarding if user has no business name set and hasn't completed onboarding
        if (profile && (!profile.business_name || !profile.onboarding_completed)) {
          setShowOnboardingFlow(true);
        }
      }
    };

    checkOnboardingStatus();
  }, [user, session]);

  const updateOnboardingData = (data: Partial<OnboardingFlowContextType['onboardingData']>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const completeOnboardingFlow = async () => {
    if (!user) return;

    // Generate store handle from business name
    const storeHandle = onboardingData.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    // Update profile with all onboarding data
    const profileUpdates: any = {
      business_name: onboardingData.businessName,
      whatsapp_number: onboardingData.whatsappNumber,
      store_handle: storeHandle,
      onboarding_completed: true
    };

    if (onboardingData.logoUrl) {
      profileUpdates.logo_url = onboardingData.logoUrl;
    }

    if (onboardingData.paymentMethod === 'snapscan') {
      profileUpdates.snapscan_link = onboardingData.paymentDetails;
    } else if (onboardingData.paymentMethod === 'payfast') {
      profileUpdates.payfast_link = onboardingData.paymentDetails;
    } else if (onboardingData.paymentMethod === 'eft') {
      profileUpdates.eft_details = onboardingData.paymentDetails;
    }

    await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    setShowOnboardingFlow(false);
    // Start overlay tutorial after completion
    setTimeout(() => {
      setShowOverlayTutorial(true);
      setOverlayStep(1);
    }, 1000);
  };

  const startOverlayTutorial = () => {
    setShowOverlayTutorial(true);
    setOverlayStep(1);
  };

  const value = {
    showOnboardingFlow,
    currentStep,
    onboardingData,
    setCurrentStep,
    updateOnboardingData,
    completeOnboardingFlow,
    showOverlayTutorial,
    setShowOverlayTutorial,
    overlayStep,
    setOverlayStep,
    startOverlayTutorial,
  };

  return (
    <OnboardingFlowContext.Provider value={value}>
      {children}
    </OnboardingFlowContext.Provider>
  );
};
