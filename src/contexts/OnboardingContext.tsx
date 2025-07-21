
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingContextType {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
  needsBillingSetup: boolean;
  setNeedsBillingSetup: (needs: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsBillingSetup, setNeedsBillingSetup] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, has_active_subscription, trial_ends_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          // Check if user needs billing setup (first time login without subscription)
          if (!profile.has_active_subscription && !profile.onboarding_completed) {
            setNeedsBillingSetup(true);
          } else if (profile.onboarding_completed && !showOnboarding) {
            // User has completed billing setup, show onboarding modal
            setShowOnboarding(true);
          }
        }
      }
    };

    checkOnboardingStatus();
  }, [user, session, showOnboarding]);

  const createDefaultSections = async () => {
    if (!user) return;

    try {
      // Create default Products section
      await supabase
        .from('store_sections')
        .insert({
          user_id: user.id,
          section_type: 'products',
          section_title: 'Our Products',
          section_content: '',
          section_order: 1,
          is_enabled: true,
          section_settings: {}
        });

      console.log('Default store sections created successfully');
    } catch (error) {
      console.error('Error creating default sections:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id);

    // Create default store sections
    await createDefaultSections();

    setShowOnboarding(false);
    setNeedsBillingSetup(false);
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
  };

  const value = {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    needsBillingSetup,
    setNeedsBillingSetup,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
