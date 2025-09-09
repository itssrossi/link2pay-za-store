import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  trialExpired: boolean;
  subscriptionStatus: string;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [trialExpired, setTrialExpired] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async (retryCount = 0) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('trial_ends_at, has_active_subscription, subscription_status, trial_expired')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile) {
        if (retryCount < 3) {
          console.warn(`Failed to fetch subscription (attempt ${retryCount + 1}/3). Retrying...`);
          await new Promise((r) => setTimeout(r, 2000));
          return refreshSubscription(retryCount + 1);
        } else {
          console.error('Failed to fetch subscription after 3 attempts. Setting defaults.');
          // Set safe defaults when we can't fetch subscription data
          setHasActiveSubscription(false);
          setIsTrialActive(false);
          setTrialEndsAt(null);
          setTrialDaysLeft(0);
          setTrialExpired(true);
          setSubscriptionStatus('expired');
          setLoading(false);
          return;
        }
      }

      if (profile) {
        const now = new Date();
        const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        
        // Calculate trial status
        const isTrialStillActive = trialEnd ? trialEnd > now : false;
        const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
        const isExpired = trialEnd ? trialEnd <= now : false;

        setHasActiveSubscription(profile.has_active_subscription || false);
        setIsTrialActive(isTrialStillActive);
        setTrialEndsAt(profile.trial_ends_at);
        setTrialDaysLeft(daysLeft);
        setTrialExpired(profile.trial_expired || isExpired);
        setSubscriptionStatus(profile.subscription_status || 'trial');

        console.log('Subscription status updated:', {
          hasActiveSubscription: profile.has_active_subscription,
          isTrialActive: isTrialStillActive,
          trialExpired: profile.trial_expired || isExpired,
          subscriptionStatus: profile.subscription_status,
          daysLeft
        });
      }
    } catch (error) {
      console.error('Error in refreshSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      // Reset state when user logs out
      setHasActiveSubscription(false);
      setIsTrialActive(false);
      setTrialEndsAt(null);
      setTrialDaysLeft(0);
      setTrialExpired(false);
      setSubscriptionStatus('trial');
      setLoading(false);
    }
  }, [user]);

  const value: SubscriptionContextType = {
    hasActiveSubscription,
    isTrialActive,
    trialEndsAt,
    trialDaysLeft,
    trialExpired,
    subscriptionStatus,
    loading,
    refreshSubscription: () => refreshSubscription(),
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};