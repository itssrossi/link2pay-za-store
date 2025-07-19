
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
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_active_subscription, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const trialEnd = new Date(data.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setHasActiveSubscription(data.has_active_subscription);
      setTrialEndsAt(data.trial_ends_at);
      setIsTrialActive(trialEnd > now);
      setTrialDaysLeft(Math.max(0, daysLeft));
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  const value = {
    hasActiveSubscription,
    isTrialActive,
    trialEndsAt,
    trialDaysLeft,
    loading,
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
