
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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
  const { user, session, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [needsBillingSetup, setNeedsBillingSetup] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for auth to be ready
      if (authLoading || !user || !session) {
        console.log('Onboarding check skipped - auth not ready');
        return;
      }

      try {
        console.log('Checking onboarding status for user:', user.id);
        
        // Add a small delay to allow profile creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, has_active_subscription, trial_ends_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          
          if (error.code === 'PGRST116') {
            console.log('Profile not found - setting up for billing');
            // Profile doesn't exist yet, user needs billing setup
            setNeedsBillingSetup(true);
            setShowOnboarding(false);
          }
        } else if (profile) {
          console.log('Profile data:', profile);
          
          // If user has active subscription (including dev accounts), no billing setup needed
          if (profile.has_active_subscription) {
            setNeedsBillingSetup(false);
            // Show onboarding modal if not completed yet
            if (!profile.onboarding_completed) {
              console.log('User has subscription but onboarding not completed');
              setShowOnboarding(true);
            }
          } else if (!profile.onboarding_completed) {
            // User needs billing setup (first time login without subscription)
            console.log('User needs billing setup');
            setNeedsBillingSetup(true);
            setShowOnboarding(false);
          } else {
            // Check if trial is still active
            const trialEnd = new Date(profile.trial_ends_at);
            const now = new Date();
            const isTrialActive = trialEnd > now;
            
            if (!isTrialActive) {
              console.log('Trial expired, user needs billing setup');
              setNeedsBillingSetup(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, session, authLoading]);

  const createDefaultSections = async () => {
    if (!user) return;

    try {
      console.log('Creating default store sections for user:', user.id);
      
      // Check if sections already exist
      const { data: existingSections } = await supabase
        .from('store_sections')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingSections && existingSections.length > 0) {
        console.log('Store sections already exist');
        return;
      }

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

    try {
      console.log('Completing onboarding for user:', user.id);
      
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Create default store sections
      await createDefaultSections();

      setShowOnboarding(false);
      setNeedsBillingSetup(false);
      
      console.log('Onboarding completed successfully');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
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
