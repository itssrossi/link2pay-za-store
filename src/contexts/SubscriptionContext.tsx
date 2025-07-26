
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, loading: authLoading } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    // Don't try to refresh if auth is still loading or user is not available
    if (authLoading || !user || !session) {
      console.log('Skipping subscription refresh - auth not ready or user not available');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching subscription status for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('has_active_subscription, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        
        // If profile doesn't exist yet, set defaults and wait
        if (error.code === 'PGRST116') {
          console.log('Profile not found - user may be newly created');
          setHasActiveSubscription(false);
          setIsTrialActive(true);
          setTrialEndsAt(null);
          setTrialDaysLeft(7);
        }
      } else if (data) {
        console.log('Subscription data:', data);
        
        const trialEnd = new Date(data.trial_ends_at);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        setHasActiveSubscription(data.has_active_subscription);
        setTrialEndsAt(data.trial_ends_at);
        setIsTrialActive(trialEnd > now && !data.has_active_subscription);
        setTrialDaysLeft(Math.max(0, daysLeft));
        
        console.log('Subscription status updated:', {
          hasActiveSubscription: data.has_active_subscription,
          isTrialActive: trialEnd > now && !data.has_active_subscription,
          trialDaysLeft: Math.max(0, daysLeft)
        });
      }
    } catch (error) {
      console.error('Unexpected error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only refresh subscription when auth is ready and user is available
    if (!authLoading && user && session) {
      refreshSubscription();
    } else if (!authLoading && !user) {
      // User is not authenticated, reset subscription state
      console.log('User not authenticated, resetting subscription state');
      setHasActiveSubscription(false);
      setIsTrialActive(false);
      setTrialEndsAt(null);
      setTrialDaysLeft(0);
      setLoading(false);
    }
  }, [user, session, authLoading]);

  const value = {
    hasActiveSubscription,
    isTrialActive,
    trialEndsAt,
    trialDaysLeft,
    loading: loading || authLoading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
