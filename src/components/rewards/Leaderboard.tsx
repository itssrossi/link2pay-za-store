import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Zap, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LeaderboardEntry {
  userId: string;
  businessName: string;
  storeHandle: string;
  revenue: number;
  points: number;
  badgeCount: number;
  rank: number;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all users with their profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, business_name, store_handle')
        .not('business_name', 'is', null)
        .eq('store_visibility', true);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        setLeaderboardData([]);
        return;
      }

      // Fetch rewards and revenue for each user in parallel
      const leaderboardPromises = profiles.map(async (profile) => {
        const [rewardsResult, revenueResult] = await Promise.all([
          supabase
            .from('user_rewards')
            .select('points_total, badges')
            .eq('user_id', profile.id)
            .maybeSingle(),
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('user_id', profile.id)
            .eq('status', 'paid')
            .gte('created_at', thirtyDaysAgo)
        ]);

        const revenue = revenueResult.data?.reduce(
          (sum, inv) => sum + Number(inv.total_amount || 0), 
          0
        ) || 0;

        return {
          userId: profile.id,
          businessName: profile.business_name || 'Unknown Store',
          storeHandle: profile.store_handle || 'unknown',
          revenue,
          points: rewardsResult.data?.points_total || 0,
          badgeCount: rewardsResult.data?.badges?.length || 0,
          rank: 0
        };
      });

      const allUsers = await Promise.all(leaderboardPromises);
      
      // Sort by revenue descending, take top 10, assign ranks
      const sorted = allUsers
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboardData(sorted);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Top Performers - Last 30 Days
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top earners ranked by total revenue from paid invoices
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-center">No activity yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Be the first to generate revenue and climb the leaderboard!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Badges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((entry) => (
                  <TableRow 
                    key={entry.userId}
                    className={entry.userId === user?.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
                  >
                    <TableCell className="text-center">
                      {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="text-lg font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{entry.businessName}</span>
                        <span className="text-xs text-muted-foreground">
                          @{entry.storeHandle}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      R{entry.revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{entry.points}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold">{entry.badgeCount}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
