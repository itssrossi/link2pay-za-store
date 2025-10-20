import { supabase } from '@/integrations/supabase/client';
import { BADGES } from '@/types/rewards';
import { toast } from 'sonner';
import { triggerConfetti } from '@/components/ui/confetti';
import { playCelebrationSound } from '@/utils/celebrationSound';

export const awardPoints = async (
  userId: string,
  activityType: string,
  points: number,
  metadata: any = {}
): Promise<void> => {
  try {
    console.log('🎯 Awarding points:', { userId, activityType, points, metadata });
    
    const { data: rewards, error: fetchError } = await supabase
      .from('user_rewards')
      .select('points_total, points_weekly')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching rewards:', fetchError);
      throw fetchError;
    }

    const currentTotal = rewards?.points_total || 0;
    const currentWeekly = rewards?.points_weekly || 0;

    console.log('📊 Current points:', { currentTotal, currentWeekly });

    const { error: updateError } = await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        points_total: currentTotal + points,
        points_weekly: currentWeekly + points
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error updating points:', updateError);
      throw updateError;
    }

    // Log activity (non-blocking - don't throw if this fails)
    try {
      await supabase
        .from('reward_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          points_earned: points,
          metadata
        });
      console.log('✅ Activity logged successfully');
    } catch (logError) {
      console.error('⚠️ Non-blocking: failed to log reward activity:', logError);
    }

    console.log('✅ Points awarded successfully');

    // Check for badge unlocks (but avoid recursive calls for badge_unlock activity)
    if (activityType !== 'badge_unlock') {
      await checkBadgeUnlocks(userId);
    }
  } catch (error) {
    console.error('❌ Error in awardPoints:', error);
    throw error;
  }
};

export const checkBadgeUnlocks = async (userId: string): Promise<string[]> => {
  try {
    const [invoiceCount, weeklyInvoices, dailyInvoices, weeklyRevenue, repeatCustomers, { data: currentRewards }] = await Promise.all([
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('invoices').select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('invoices').select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('invoices').select('total_amount')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.rpc('get_repeat_customers_count', { p_user_id: userId }),
      supabase.from('user_rewards').select('badges, current_streak, points_total, points_weekly').eq('user_id', userId).maybeSingle()
    ]);

    const unlockedBadges = currentRewards?.badges || [];
    const newBadges: string[] = [];

    BADGES.forEach(badge => {
      if (unlockedBadges.includes(badge.id)) return;

      let shouldUnlock = false;

      switch (badge.unlockCriteria.type) {
        case 'invoice_count':
          let count = 0;
          if (badge.unlockCriteria.timeframe === 'weekly') count = weeklyInvoices.count || 0;
          else if (badge.unlockCriteria.timeframe === 'daily') count = dailyInvoices.count || 0;
          else count = invoiceCount.count || 0;
          shouldUnlock = count >= badge.unlockCriteria.value;
          break;
        case 'revenue':
          const revenue = weeklyRevenue.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
          shouldUnlock = revenue >= badge.unlockCriteria.value;
          break;
        case 'streak':
          shouldUnlock = (currentRewards?.current_streak || 0) >= badge.unlockCriteria.value;
          break;
        case 'customer_count':
          shouldUnlock = (repeatCustomers.data || 0) >= badge.unlockCriteria.value;
          break;
      }

      if (shouldUnlock) {
        newBadges.push(badge.id);
      }
    });

    if (newBadges.length > 0) {
      const updatedBadges = [...unlockedBadges, ...newBadges];
      
      // Calculate badge points
      const badgePoints = newBadges.reduce((sum, badgeId) => {
        const badge = BADGES.find(b => b.id === badgeId);
        return sum + (badge?.points || 0);
      }, 0);
      
      // Get current points before update
      const currentTotal = currentRewards?.points_total || 0;
      const currentWeekly = currentRewards?.points_weekly || 0;
      
      // Update badges AND points in single transaction (no recursive call)
      await supabase
        .from('user_rewards')
        .upsert({ 
          user_id: userId,
          badges: updatedBadges,
          points_total: currentTotal + badgePoints,
          points_weekly: currentWeekly + badgePoints
        }, {
          onConflict: 'user_id'
        });
      
      // Log badge unlock activity (non-blocking)
      try {
        await supabase
          .from('reward_activities')
          .insert({
            user_id: userId,
            activity_type: 'badge_unlock',
            points_earned: badgePoints,
            metadata: { badges: newBadges }
          });
      } catch (logError) {
        console.error('⚠️ Non-blocking: failed to log badge unlock activity:', logError);
      }
      
      // Show celebration for each badge
      newBadges.forEach(badgeId => {
        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) {
          toast.success(`🎉 Badge Unlocked: ${badge.name}! +${badge.points} points`, {
            duration: 5000,
          });
        }
      });
      
      triggerConfetti();
      playCelebrationSound();
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badge unlocks:', error);
    return [];
  }
};
