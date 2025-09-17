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
  total_entries: number;
  completions: number;
  skips: number;
  drop_offs: number;
  completion_rate: number;
  average_time_seconds: number;
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
export const getOnboardingProgress = async (): Promise<OnboardingProgressData[]> => {
  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching onboarding progress:', error);
    throw error;
  }
  
  return data || [];
};

/**
 * Get onboarding funnel analysis
 */
export const getFunnelAnalysis = async (onboardingType?: 'physical_products' | 'bookings'): Promise<FunnelAnalysis[]> => {
  let query = supabase
    .from('onboarding_progress')
    .select('*');
  
  if (onboardingType) {
    query = query.eq('onboarding_type', onboardingType);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching funnel data:', error);
    throw error;
  }
  
  // Group by step and analyze
  const stepGroups = data?.reduce((acc, row) => {
    const key = `${row.step_number}-${row.step_name}`;
    if (!acc[key]) {
      acc[key] = {
        step_name: row.step_name,
        step_number: row.step_number,
        entries: [],
        completions: 0,
        skips: 0,
        total_time: 0,
        time_count: 0
      };
    }
    
    acc[key].entries.push(row);
    if (row.is_completed) acc[key].completions++;
    if (row.is_skipped) acc[key].skips++;
    if (row.time_spent_seconds) {
      acc[key].total_time += row.time_spent_seconds;
      acc[key].time_count++;
    }
    
    return acc;
  }, {} as Record<string, any>) || {};
  
  return Object.values(stepGroups).map((group: any) => ({
    step_name: group.step_name,
    step_number: group.step_number,
    total_entries: group.entries.length,
    completions: group.completions,
    skips: group.skips,
    drop_offs: group.entries.length - group.completions - group.skips,
    completion_rate: group.entries.length > 0 ? (group.completions / group.entries.length) * 100 : 0,
    average_time_seconds: group.time_count > 0 ? Math.round(group.total_time / group.time_count) : 0
  })).sort((a, b) => a.step_number - b.step_number);
};

/**
 * Get comprehensive onboarding insights
 */
export const getOnboardingInsights = async (): Promise<OnboardingInsights> => {
  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*');
  
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
  
  // Get unique users who started onboarding
  const uniqueUsers = new Set(data.map(row => row.user_id));
  const totalUsersStarted = uniqueUsers.size;
  
  // Get users who completed the success step
  const successCompletions = data.filter(row => row.step_name === 'success' && row.is_completed);
  const totalUsersCompleted = successCompletions.length;
  
  // Choice breakdown
  const choiceData = data.filter(row => row.step_name === 'choice_selection' && row.is_completed);
  const choiceBreakdown = {
    physical_products: choiceData.filter(row => (row.metadata as any)?.selected_choice === 'physical_products').length,
    bookings: choiceData.filter(row => (row.metadata as any)?.selected_choice === 'bookings').length
  };
  
  // Average completion time (for completed onboardings)
  const completedUsers = Array.from(uniqueUsers).filter(userId => 
    data.some(row => row.user_id === userId && row.step_name === 'success' && row.is_completed)
  );
  
  let totalCompletionTime = 0;
  let completionTimeCount = 0;
  
  for (const userId of completedUsers) {
    const userSteps = data.filter(row => row.user_id === userId).sort((a, b) => a.step_number - b.step_number);
    if (userSteps.length > 0) {
      const startTime = new Date(userSteps[0].entered_at);
      const endTime = new Date(userSteps[userSteps.length - 1].completed_at || userSteps[userSteps.length - 1].entered_at);
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      totalCompletionTime += diffMinutes;
      completionTimeCount++;
    }
  }
  
  const funnelAnalysis = await getFunnelAnalysis();
  
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