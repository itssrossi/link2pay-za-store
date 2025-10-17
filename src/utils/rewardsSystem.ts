import { supabase } from '@/integrations/supabase/client';
import { BADGES } from '@/types/rewards';

export const awardPoints = async (
  userId: string,
  activityType: string,
  points: number,
  metadata: any = {}
): Promise<void> => {
  try {
    const { data: rewards } = await supabase
      .from('user_rewards')
      .select('points_total, points_weekly')
      .eq('user_id', userId)
      .maybeSingle();

    const currentTotal = rewards?.points_total || 0;
    const currentWeekly = rewards?.points_weekly || 0;

    await supabase
      .from('user_rewards')
      .upsert({
        user_id: userId,
        points_total: currentTotal + points,
        points_weekly: currentWeekly + points
      }, {
        onConflict: 'user_id'
      });

    await supabase
      .from('reward_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        points_earned: points,
        metadata
      });

    await checkBadgeUnlocks(userId);
  } catch (error) {
    console.error('Error awarding points:', error);
  }
};

export const checkBadgeUnlocks = async (userId: string): Promise<string[]> => {
  try {
    const [invoiceCount, weeklyInvoices, dailyInvoices, weeklyRevenue, repeatCustomers, currentRewards] = await Promise.all([
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
      supabase.from('user_rewards').select('badges, current_streak').eq('user_id', userId).maybeSingle()
    ]);

    const unlockedBadges = currentRewards?.data?.badges || [];
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
          shouldUnlock = (currentRewards?.data?.current_streak || 0) >= badge.unlockCriteria.value;
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
      await supabase
        .from('user_rewards')
        .update({ badges: updatedBadges })
        .eq('user_id', userId);

      const badgePoints = newBadges.reduce((sum, badgeId) => {
        const badge = BADGES.find(b => b.id === badgeId);
        return sum + (badge?.points || 0);
      }, 0);

      if (badgePoints > 0) {
        await awardPoints(userId, 'badge_unlock', badgePoints, { badges: newBadges });
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Error checking badge unlocks:', error);
    return [];
  }
};
