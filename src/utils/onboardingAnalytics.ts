// Utility functions for analyzing onboarding progress data
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingProgressData {
  id: string;
  user_id: string;
  step_name: string;
  step_number: number;
  onboarding_type: string | null;
  entered_at: string;
  completed_at: string | null;
  skipped_at: string | null;
  time_spent_seconds: number | null;
  is_completed: boolean;
  is_skipped: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FunnelAnalysis {
  step_name: string;
  step_number: number;
  entries: number;
  completions: number;
  skips: number;
  dropOffs: number;
  completion_rate: number;
  avg_time_seconds: number;
}

export interface OnboardingInsights {
  total_users_started: number;
  total_users_completed: number;
  overall_completion_rate: number;
  funnel_analysis: FunnelAnalysis[];
  choice_breakdown: {
    physical_products: number;
    bookings: number;
  };
  average_completion_time_minutes: number;
}

/**
 * Get detailed onboarding progress for all users
 */
export const getOnboardingProgress = async (
  startDate?: Date, 
  endDate?: Date,
  useAdminClient = false
): Promise<OnboardingProgressData[]> => {
  if (useAdminClient) {
    const { data, error } = await supabase.functions.invoke('analytics-data', {
      body: {
        type: 'progress',
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });

    if (error) throw error;
    return data || [];
  }

  let query = supabase
    .from('onboarding_progress')
    .select('*')
    .order('entered_at', { ascending: false });

  if (startDate) {
    query = query.gte('entered_at', startDate.toISOString());
  }
  
  if (endDate) {
    query = query.lte('entered_at', endDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching onboarding progress:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get onboarding funnel analysis
 */
export const getFunnelAnalysis = async (
  onboardingType?: 'physical_products' | 'bookings',
  startDate?: Date,
  endDate?: Date,
  useAdminClient = false
): Promise<FunnelAnalysis[]> => {
  if (useAdminClient) {
    const { data, error } = await supabase.functions.invoke('analytics-data', {
      body: {
        type: 'funnel',
        onboardingType,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });

    if (error) throw error;
    return data || [];
  }

  // Get all onboarding progress data with proper filtering
  let query = supabase
    .from('onboarding_progress')
    .select('step_name, step_number, onboarding_type, entered_at, completed_at, is_completed, is_skipped, time_spent_seconds, user_id')
    .order('user_id')
    .order('step_number')

  if (startDate) {
    query = query.gte('entered_at', startDate.toISOString())
  }
  if (endDate) {
    query = query.lte('entered_at', endDate.toISOString())
  }
  if (onboardingType) {
    query = query.eq('onboarding_type', onboardingType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching funnel data:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Create user journey map to track progression
  const userJourneys = new Map<string, any[]>()
  data.forEach(record => {
    if (!userJourneys.has(record.user_id)) {
      userJourneys.set(record.user_id, [])
    }
    userJourneys.get(record.user_id)!.push(record)
  })

  // Define step sequence (accounting for branching at step 2)
  const stepSequence = [
    { number: 0, name: 'choice_selection' },
    { number: 1, name: 'logo_upload' },
    { number: 2, name: 'availability_setup', branch: 'bookings' },
    { number: 2, name: 'product_setup', branch: 'physical_products' },
    { number: 3, name: 'payment_setup' },
    { number: 4, name: 'success' }
  ]

  // Calculate accurate funnel metrics
  const funnelResults: FunnelAnalysis[] = []

  for (const step of stepSequence) {
    // Skip branching steps if filtering by onboarding type
    if (onboardingType && step.branch && step.branch !== onboardingType) {
      continue
    }

    const usersAtStep = Array.from(userJourneys.values()).filter(journey => 
      journey.some(record => 
        record.step_number === step.number && 
        record.step_name === step.name &&
        (!onboardingType || !step.branch || record.onboarding_type === onboardingType)
      )
    )

    const stepRecords = data.filter(record => 
      record.step_number === step.number && 
      record.step_name === step.name &&
      (!onboardingType || !step.branch || record.onboarding_type === onboardingType)
    )

    const entries = usersAtStep.length
    const completions = stepRecords.filter(r => r.is_completed).length
    const skips = stepRecords.filter(r => r.is_skipped).length
    
    // Calculate drop-offs: users who reached this step but never progressed to next step
    let dropOffs = 0
    if (step.number < 4) { // Don't calculate drop-offs for final step
      const nextStepUsers = new Set<string>()
      
      // Handle branching logic for step 2
      if (step.number === 1) {
        // Next step after logo_upload depends on onboarding type
        Array.from(userJourneys.values()).forEach(journey => {
          const hasAvailability = journey.some(r => r.step_number === 2 && r.step_name === 'availability_setup')
          const hasProduct = journey.some(r => r.step_number === 2 && r.step_name === 'product_setup')
          if (hasAvailability || hasProduct) {
            const userId = journey[0]?.user_id
            if (userId) nextStepUsers.add(userId)
          }
        })
      } else if (step.number === 0) {
        // Next step after choice_selection is logo_upload
        Array.from(userJourneys.values()).forEach(journey => {
          const hasNextStep = journey.some(r => r.step_number === 1)
          if (hasNextStep) {
            const userId = journey[0]?.user_id
            if (userId) nextStepUsers.add(userId)
          }
        })
      } else {
        // Regular progression
        const nextStepNumber = step.number + 1
        Array.from(userJourneys.values()).forEach(journey => {
          const hasNextStep = journey.some(r => r.step_number === nextStepNumber)
          if (hasNextStep) {
            const userId = journey[0]?.user_id
            if (userId) nextStepUsers.add(userId)
          }
        })
      }

      dropOffs = Math.max(0, entries - nextStepUsers.size)
    }

    const completionRate = entries > 0 ? ((completions + skips) / entries) * 100 : 0
    const totalTime = stepRecords.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0)
    const avgTime = entries > 0 ? totalTime / entries : 0

    funnelResults.push({
      step_name: step.name,
      step_number: step.number,
      entries,
      completions,
      skips,
      dropOffs,
      completion_rate: completionRate,
      avg_time_seconds: avgTime
    })
  }

  return funnelResults.sort((a, b) => a.step_number - b.step_number)
}

/**
 * Get comprehensive onboarding insights
 */
export const getOnboardingInsights = async (
  startDate?: Date, 
  endDate?: Date,
  useAdminClient = false
): Promise<OnboardingInsights> => {
  if (useAdminClient) {
    const { data, error } = await supabase.functions.invoke('analytics-data', {
      body: {
        type: 'insights',
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });

    if (error) throw error;
    return data;
  }

  let query = supabase
    .from('onboarding_progress')
    .select('*');

  if (startDate) {
    query = query.gte('entered_at', startDate.toISOString());
  }
  
  if (endDate) {
    query = query.lte('entered_at', endDate.toISOString());
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching insights:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return {
      total_users_started: 0,
      total_users_completed: 0,
      overall_completion_rate: 0,
      funnel_analysis: [],
      choice_breakdown: { physical_products: 0, bookings: 0 },
      average_completion_time_minutes: 0
    };
  }
  
  // Get unique users who started onboarding (entered choice_selection)
  const startedUsers = new Set(
    data.filter(row => row.step_name === 'choice_selection').map(row => row.user_id)
  );
  const totalUsersStarted = startedUsers.size;
  
  // Get users who completed the success step
  const completedUsers = new Set(
    data.filter(row => row.step_name === 'success' && row.is_completed).map(row => row.user_id)
  );
  const totalUsersCompleted = completedUsers.size;
  
  // Choice breakdown - get completed choice selections
  const choiceData = data.filter(row => row.step_name === 'choice_selection' && row.is_completed);
  const choiceBreakdown = {
    physical_products: choiceData.filter(row => (row.metadata as any)?.selected_choice === 'physical_products').length,
    bookings: choiceData.filter(row => (row.metadata as any)?.selected_choice === 'bookings').length
  };
  
  // Average completion time (for completed onboardings)
  let totalCompletionTime = 0;
  let completionTimeCount = 0;
  
  for (const userId of completedUsers) {
    const userSteps = data
      .filter(row => row.user_id === userId)
      .sort((a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime());
    
    if (userSteps.length > 0) {
      const firstStep = userSteps.find(s => s.step_name === 'choice_selection');
      const lastStep = userSteps.find(s => s.step_name === 'success' && s.is_completed);
      
      if (firstStep && lastStep) {
        const startTime = new Date(firstStep.entered_at);
        const endTime = new Date(lastStep.completed_at || lastStep.entered_at);
        const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        if (diffMinutes > 0) {
          totalCompletionTime += diffMinutes;
          completionTimeCount++;
        }
      }
    }
  }
  
  const funnelAnalysis = await getFunnelAnalysis(undefined, startDate, endDate);
  
  return {
    total_users_started: totalUsersStarted,
    total_users_completed: totalUsersCompleted,
    overall_completion_rate: totalUsersStarted > 0 ? (totalUsersCompleted / totalUsersStarted) * 100 : 0,
    funnel_analysis: funnelAnalysis,
    choice_breakdown: choiceBreakdown,
    average_completion_time_minutes: completionTimeCount > 0 ? Math.round(totalCompletionTime / completionTimeCount) : 0
  };
};

/**
 * SQL queries for manual analysis (to run in Supabase SQL editor)
 */
export const ANALYSIS_QUERIES = {
  // Overall funnel conversion
  FUNNEL_OVERVIEW: `
    SELECT 
      step_name,
      step_number,
      COUNT(*) as total_entries,
      COUNT(*) FILTER (WHERE is_completed = true) as completions,
      COUNT(*) FILTER (WHERE is_skipped = true) as skips,
      ROUND(COUNT(*) FILTER (WHERE is_completed = true) * 100.0 / COUNT(*), 2) as completion_rate,
      ROUND(AVG(time_spent_seconds)) as avg_time_seconds
    FROM onboarding_progress 
    GROUP BY step_name, step_number 
    ORDER BY step_number;
  `,
  
  // Drop-off analysis
  DROP_OFF_ANALYSIS: `
    WITH user_progress AS (
      SELECT 
        user_id,
        MAX(step_number) as furthest_step,
        onboarding_type
      FROM onboarding_progress 
      GROUP BY user_id, onboarding_type
    )
    SELECT 
      furthest_step,
      onboarding_type,
      COUNT(*) as users_count
    FROM user_progress 
    GROUP BY furthest_step, onboarding_type 
    ORDER BY furthest_step;
  `,
  
  // Choice comparison
  CHOICE_COMPARISON: `
    SELECT 
      op.onboarding_type,
      COUNT(DISTINCT op.user_id) as users_started,
      COUNT(DISTINCT CASE WHEN op2.step_name = 'success' AND op2.is_completed THEN op.user_id END) as users_completed,
      ROUND(
        COUNT(DISTINCT CASE WHEN op2.step_name = 'success' AND op2.is_completed THEN op.user_id END) * 100.0 / 
        COUNT(DISTINCT op.user_id), 2
      ) as completion_rate
    FROM onboarding_progress op
    LEFT JOIN onboarding_progress op2 ON op.user_id = op2.user_id
    WHERE op.onboarding_type IS NOT NULL
    GROUP BY op.onboarding_type;
  `,
  
  // Time analysis
  TIME_ANALYSIS: `
    SELECT 
      step_name,
      step_number,
      MIN(time_spent_seconds) as min_time,
      ROUND(AVG(time_spent_seconds)) as avg_time,
      MAX(time_spent_seconds) as max_time,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent_seconds)) as median_time
    FROM onboarding_progress 
    WHERE time_spent_seconds IS NOT NULL
    GROUP BY step_name, step_number 
    ORDER BY step_number;
  `
};