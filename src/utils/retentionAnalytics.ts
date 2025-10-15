import { supabase } from "@/integrations/supabase/client";

export interface RetentionStats {
  date: string;
  active_count: number;
  at_risk_count: number;
  dormant_count: number;
  total_users: number;
}

export interface UserNotification {
  id: string;
  user_id: string;
  message_type: string;
  message_content: string;
  sent_at: string;
  user_email?: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  tag: 'active' | 'at_risk' | 'dormant';
  last_invoice_at: string | null;
  last_dashboard_visit: string | null;
  tag_updated_at: string;
  user_email?: string;
}

export async function getRetentionStats(
  startDate: string,
  endDate: string
): Promise<RetentionStats[]> {
  const { data, error } = await supabase.rpc('get_retention_stats', {
    start_date: startDate,
    end_date: endDate
  });

  if (error) {
    console.error('Error fetching retention stats:', error);
    return [];
  }

  return data || [];
}

export async function getRecentNotifications(limit: number = 20): Promise<UserNotification[]> {
  const { data: notifications, error: notifError } = await supabase
    .from('user_notifications')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (notifError) {
    console.error('Error fetching notifications:', notifError);
    return [];
  }

  if (!notifications) return [];

  // Fetch profiles for these users
  const userIds = notifications.map(n => n.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

  return notifications.map(item => ({
    ...item,
    user_email: profileMap.get(item.user_id)
  }));
}

export async function getUserActivityBreakdown(): Promise<UserActivity[]> {
  const { data: activities, error: activityError } = await supabase
    .from('user_activity')
    .select('*')
    .order('tag_updated_at', { ascending: false });

  if (activityError) {
    console.error('Error fetching user activity:', activityError);
    return [];
  }

  if (!activities) return [];

  // Fetch profiles for these users
  const userIds = activities.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

  return activities.map(item => ({
    ...item,
    tag: item.tag as 'active' | 'at_risk' | 'dormant',
    user_email: profileMap.get(item.user_id)
  }));
}
