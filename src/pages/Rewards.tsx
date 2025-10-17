import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Zap } from 'lucide-react';
import { WeeklySummary } from '@/components/rewards/WeeklySummary';
import { StreakDisplay } from '@/components/rewards/StreakDisplay';
import { BadgeGrid } from '@/components/rewards/BadgeGrid';
import { Leaderboard } from '@/components/rewards/Leaderboard';
import { RewardsComingSoonModal } from '@/components/rewards/RewardsComingSoonModal';
import { Skeleton } from '@/components/ui/skeleton';

const Rewards = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [weeklyInvoices, setWeeklyInvoices] = useState(0);
  const [repeatCustomers, setRepeatCustomers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchRewardsData();
    }
  }, [user]);

  const fetchRewardsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        rewardsData,
        weeklyInvoicesData,
        weeklyRevenueData,
        repeatCustomersData
      ] = await Promise.all([
        supabase.from('user_rewards').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('invoices').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).gte('created_at', sevenDaysAgo),
        supabase.from('invoices').select('total_amount')
          .eq('user_id', user.id).eq('status', 'paid').gte('created_at', sevenDaysAgo),
        supabase.rpc('get_repeat_customers_count', { p_user_id: user.id })
      ]);

      const rewards = rewardsData.data;
      const hasSeenPopup = rewards?.has_seen_rewards_popup || false;

      if (!hasSeenPopup) {
        setShowPopup(true);
      }

      setCurrentStreak(rewards?.current_streak || 0);
      setTotalPoints(rewards?.points_total || 0);
      setWeeklyPoints(rewards?.points_weekly || 0);
      setUnlockedBadges(rewards?.badges || []);

      setWeeklyInvoices(weeklyInvoicesData.count || 0);
      const revenue = weeklyRevenueData.data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
      setWeeklyEarnings(revenue);
      setRepeatCustomers(repeatCustomersData.data || 0);

      if (!rewards) {
        await supabase.from('user_rewards').insert({
          user_id: user.id,
          points_total: 0,
          points_weekly: 0,
          current_streak: 0,
          longest_streak: 0
        });
      }

    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Rewards
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your progress and earn rewards
            </p>
          </div>
          {currentStreak > 0 && <StreakDisplay streak={currentStreak} />}
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Your Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-4xl font-bold text-primary">{totalPoints}</div>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
              <div className="text-muted-foreground">|</div>
              <div>
                <div className="text-2xl font-semibold">{weeklyPoints}</div>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <WeeklySummary
          weeklyEarnings={weeklyEarnings}
          invoicesSent={weeklyInvoices}
          repeatCustomers={repeatCustomers}
        />

        <Tabs defaultValue="badges" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Your Badges</CardTitle>
              </CardHeader>
              <CardContent>
                <BadgeGrid unlockedBadges={unlockedBadges} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>

      <RewardsComingSoonModal
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </Layout>
  );
};

export default Rewards;
