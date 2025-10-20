import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export const RewardsHeaderDisplay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchRewards = async () => {
      try {
        const { data, error } = await supabase
          .from('user_rewards')
          .select('points_total, badges')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTotalPoints(data.points_total || 0);
          setBadgeCount(data.badges?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/rewards')}
      className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20 hover:border-primary/30"
    >
      <div className="flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold text-primary hidden md:inline">
          {totalPoints}
        </span>
      </div>
      
      <span className="hidden md:inline text-muted-foreground">•</span>
      
      <div className="flex items-center gap-1.5">
        <Award className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold text-primary hidden md:inline">
          {badgeCount}
        </span>
      </div>
    </button>
  );
};
