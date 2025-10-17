import { supabase } from '@/integrations/supabase/client';

export const updateStreakOnInvoice = async (userId: string): Promise<number> => {
  try {
    const { data: rewards, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching rewards:', error);
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];

    if (!rewards) {
      const { data: newRewards } = await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          points_total: 5,
          points_weekly: 5
        })
        .select()
        .single();
      
      return newRewards?.current_streak || 1;
    }

    const lastActivity = rewards.last_activity_date;
    const streakSafeDate = rewards.streak_safe_date;

    if (!lastActivity) {
      await supabase
        .from('user_rewards')
        .update({
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today
        })
        .eq('user_id', userId);
      return 1;
    }

    const daysSinceActivity = Math.floor(
      (new Date(today).getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = rewards.current_streak;

    if (daysSinceActivity === 0) {
      return newStreak;
    } else if (daysSinceActivity === 1) {
      newStreak = rewards.current_streak + 1;
    } else if (daysSinceActivity === 2 && streakSafeDate === lastActivity) {
      newStreak = rewards.current_streak + 1;
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, rewards.longest_streak);

    await supabase
      .from('user_rewards')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        streak_safe_date: daysSinceActivity === 1 ? today : streakSafeDate
      })
      .eq('user_id', userId);

    await supabase
      .from('reward_activities')
      .insert({
        user_id: userId,
        activity_type: 'streak_day',
        points_earned: 5,
        metadata: { streak: newStreak }
      });

    return newStreak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return 0;
  }
};
