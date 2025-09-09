
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
  needsSubscriptionPayment: boolean;
  setNeedsSubscriptionPayment: (needs: boolean) => void;
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
  const [needsSubscriptionPayment, setNeedsSubscriptionPayment] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for auth to be ready, but don't wait forever
      if (authLoading) {
        console.log('Onboarding check skipped - auth still loading');
        return;
      }

      if (!user || !session) {
        console.log('Onboarding check skipped - no user or session');
        // Reset onboarding states when no user
        setShowOnboarding(false);
        setNeedsBillingSetup(false);
        setNeedsSubscriptionPayment(false);
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
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return; // Exit early on error
        }

        if (!profile) {
          console.log('Profile not found - setting up for billing');
          // Profile doesn't exist yet, user needs billing setup
          setNeedsBillingSetup(true);
          setNeedsSubscriptionPayment(false);
          setShowOnboarding(false);
        } else {
          console.log('Profile data:', profile);
          
          // If user has active subscription (including dev accounts), no billing setup needed
          if (profile.has_active_subscription) {
            setNeedsBillingSetup(false);
            setNeedsSubscriptionPayment(false);
            // Show onboarding if not completed yet and not already completed in this session
            if (!profile.onboarding_completed && !onboardingCompleted) {
              console.log('User has subscription but onboarding not completed - showing onboarding');
              setShowOnboarding(true);
            }
          } else {
            // Check if user has started a trial
            if (!profile.trial_ends_at) {
              // User has never started a trial, needs billing setup
              console.log('User has no trial, needs billing setup');
              setNeedsBillingSetup(true);
              setNeedsSubscriptionPayment(false);
              setShowOnboarding(false);
            } else {
              // User has trial_ends_at, check if trial is still active
              const trialEnd = new Date(profile.trial_ends_at);
              const now = new Date();
              const isTrialActive = trialEnd > now;
              
              if (!profile.onboarding_completed && !onboardingCompleted && isTrialActive) {
                // User needs to complete onboarding during active trial
                console.log('User needs to complete onboarding during trial');
                setShowOnboarding(true);
                setNeedsBillingSetup(false);
                setNeedsSubscriptionPayment(false);
              } else if (!isTrialActive) {
                // Trial has expired, user needs subscription payment
                console.log('Trial expired, user needs subscription payment');
                setNeedsBillingSetup(false);
                setNeedsSubscriptionPayment(true);
                setShowOnboarding(false);
              } else {
                // Trial is active and onboarding completed
                console.log('Trial active, onboarding completed');
                setNeedsBillingSetup(false);
                setNeedsSubscriptionPayment(false);
                setShowOnboarding(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    // Add timeout to prevent hanging on auth issues
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.warn('Onboarding check timeout - auth took too long');
      }
    }, 5000);

    checkOnboardingStatus();
    
    return () => clearTimeout(timeoutId);
  }, [user, session, authLoading]);

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      console.log('Completing onboarding for user:', user.id);
      
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      setShowOnboarding(false);
      setNeedsBillingSetup(false);
      setNeedsSubscriptionPayment(false);
      setOnboardingCompleted(true);
      
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
    needsSubscriptionPayment,
    setNeedsSubscriptionPayment,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
