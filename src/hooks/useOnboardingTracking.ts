import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingChoice } from '@/components/onboarding/NewOnboardingContainer';

interface TrackingData {
  stepName: string;
  stepNumber: number;
  onboardingType?: OnboardingChoice;
  metadata?: Record<string, any>;
}

export const useOnboardingTracking = (data: TrackingData) => {
  const { user } = useAuth();
  const enteredAtRef = useRef<Date | null>(null);
  const progressIdRef = useRef<string | null>(null);

  // Track step entry
  useEffect(() => {
    if (!user) return;

    const trackStepEntry = async () => {
      enteredAtRef.current = new Date();
      
      try {
        const { data: progressData } = await supabase
          .from('onboarding_progress')
          .insert({
            user_id: user.id,
            step_name: data.stepName,
            step_number: data.stepNumber,
            onboarding_type: data.onboardingType || null,
            entered_at: enteredAtRef.current.toISOString(),
            metadata: data.metadata || {}
          })
          .select('id')
          .single();
        
        if (progressData) {
          progressIdRef.current = progressData.id;
        }
      } catch (error) {
        console.error('Error tracking step entry:', error);
      }
    };

    trackStepEntry();
  }, [user, data.stepName, data.stepNumber, data.onboardingType]);

  // Track step completion
  const trackCompletion = async (metadata?: Record<string, any>) => {
    if (!user || !progressIdRef.current || !enteredAtRef.current) return;

    const completedAt = new Date();
    const timeSpentSeconds = Math.round((completedAt.getTime() - enteredAtRef.current.getTime()) / 1000);

    try {
      await supabase
        .from('onboarding_progress')
        .update({
          completed_at: completedAt.toISOString(),
          time_spent_seconds: timeSpentSeconds,
          is_completed: true,
          metadata: { ...data.metadata, ...metadata }
        })
        .eq('id', progressIdRef.current);
    } catch (error) {
      console.error('Error tracking step completion:', error);
    }
  };

  // Track step skip
  const trackSkip = async (reason?: string) => {
    if (!user || !progressIdRef.current || !enteredAtRef.current) return;

    const skippedAt = new Date();
    const timeSpentSeconds = Math.round((skippedAt.getTime() - enteredAtRef.current.getTime()) / 1000);

    try {
      await supabase
        .from('onboarding_progress')
        .update({
          skipped_at: skippedAt.toISOString(),
          time_spent_seconds: timeSpentSeconds,
          is_skipped: true,
          metadata: { ...data.metadata, skip_reason: reason }
        })
        .eq('id', progressIdRef.current);
    } catch (error) {
      console.error('Error tracking step skip:', error);
    }
  };

  return {
    trackCompletion,
    trackSkip
  };
};