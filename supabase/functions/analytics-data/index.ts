import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { type, startDate, endDate, onboardingType } = await req.json();

    let result;

    switch (type) {
      case 'progress': {
        let query = supabaseAdmin
          .from('onboarding_progress')
          .select('*')
          .order('created_at', { ascending: false });

        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        result = data;
        break;
      }

      case 'funnel': {
        let query = supabaseAdmin
          .from('onboarding_progress')
          .select('step_name, step_number, onboarding_type, entered_at, completed_at, is_completed, is_skipped, time_spent_seconds, user_id')
          .order('user_id')
          .order('step_number');

        if (onboardingType) {
          query = query.eq('onboarding_type', onboardingType);
        }
        if (startDate) {
          query = query.gte('entered_at', startDate);
        }
        if (endDate) {
          query = query.lte('entered_at', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Process funnel data
        const stepMap = new Map();
        const userJourneys = new Map();

        data.forEach(record => {
          const stepKey = `${record.step_name}-${record.step_number}`;
          
          if (!stepMap.has(stepKey)) {
            stepMap.set(stepKey, {
              step_name: record.step_name,
              step_number: record.step_number,
              users_entered: new Set(),
              users_completed: new Set(),
              users_skipped: new Set(),
              total_time_spent: 0,
              time_count: 0
            });
          }

          const step = stepMap.get(stepKey);
          step.users_entered.add(record.user_id);

          if (record.is_completed) {
            step.users_completed.add(record.user_id);
          }
          if (record.is_skipped) {
            step.users_skipped.add(record.user_id);
          }
          if (record.time_spent_seconds) {
            step.total_time_spent += record.time_spent_seconds;
            step.time_count++;
          }

          if (!userJourneys.has(record.user_id)) {
            userJourneys.set(record.user_id, []);
          }
          userJourneys.get(record.user_id).push(record);
        });

        // Calculate drop-offs
        result = Array.from(stepMap.values())
          .map(step => {
            const entries = step.users_entered.size;
            const completions = step.users_completed.size;
            const skips = step.users_skipped.size;
            
            // Calculate drop-offs: users who entered this step but never progressed to the next step
            let dropOffs = 0;
            if (step.step_number < 4) {
              const nextStepUsers = new Set();
              const nextStepNumber = step.step_number + 1;
              
              Array.from(userJourneys.values()).forEach(journey => {
                const hasCurrentStep = journey.some(r => r.step_number === step.step_number && r.step_name === step.step_name);
                const hasNextStep = journey.some(r => r.step_number === nextStepNumber);
                
                if (hasCurrentStep && hasNextStep) {
                  const userId = journey[0]?.user_id;
                  if (userId) nextStepUsers.add(userId);
                }
              });
              
              dropOffs = Math.max(0, entries - nextStepUsers.size);
            }

            return {
              step_name: step.step_name,
              step_number: step.step_number,
              entries: entries,
              completions: completions,
              skips: skips,
              drop_offs: dropOffs,
              completion_rate: entries > 0 ? Math.round(((completions + skips) / entries) * 100) : 0,
              avg_time_seconds: step.time_count > 0 ? Math.round(step.total_time_spent / step.time_count) : 0
            };
          })
          .sort((a, b) => a.step_number - b.step_number);
        break;
      }

      case 'insights': {
        let query = supabaseAdmin
          .from('onboarding_progress')
          .select('*');

        if (startDate) {
          query = query.gte('entered_at', startDate);
        }
        if (endDate) {
          query = query.lte('entered_at', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        const userProgress = new Map();
        const choiceBreakdown = { physical_products: 0, bookings: 0 };

        data.forEach(record => {
          if (!userProgress.has(record.user_id)) {
            userProgress.set(record.user_id, {
              userId: record.user_id,
              onboardingType: record.onboarding_type,
              steps: [],
              totalTime: 0,
              isCompleted: false,
              enteredAt: record.entered_at,
              lastActivity: record.updated_at
            });
          }

          const user = userProgress.get(record.user_id);
          user.steps.push(record);

          if (record.time_spent_seconds) {
            user.totalTime += record.time_spent_seconds;
          }

          if (record.onboarding_type && ['physical_products', 'bookings'].includes(record.onboarding_type)) {
            choiceBreakdown[record.onboarding_type as keyof typeof choiceBreakdown]++;
          }
        });

        const users = Array.from(userProgress.values());
        const completedUsers = users.filter(user => 
          user.steps.some(step => step.step_name === 'success' && step.is_completed)
        );

        const totalCompletionTimes = completedUsers
          .map(user => user.totalTime)
          .filter(time => time > 0);

        const averageCompletionTime = totalCompletionTimes.length > 0
          ? totalCompletionTimes.reduce((sum, time) => sum + time, 0) / totalCompletionTimes.length
          : 0;

        result = {
          total_users_started: users.length,
          total_users_completed: completedUsers.length,
          overall_completion_rate: users.length > 0 
            ? Math.round((completedUsers.length / users.length) * 100) 
            : 0,
          average_completion_time_minutes: Math.round(averageCompletionTime / 60),
          choice_breakdown: {
            physical_products: choiceBreakdown.physical_products,
            bookings: choiceBreakdown.bookings
          }
        };
        break;
      }

      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to fetch analytics data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});