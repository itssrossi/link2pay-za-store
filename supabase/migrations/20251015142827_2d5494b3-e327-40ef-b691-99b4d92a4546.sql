-- Create user_activity table
CREATE TABLE public.user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('active', 'at_risk', 'dormant')),
  last_invoice_at TIMESTAMP WITH TIME ZONE,
  last_dashboard_visit TIMESTAMP WITH TIME ZONE,
  tag_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_tag ON public.user_activity(tag);

-- Create user_notifications table
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('active', 'at_risk', 'dormant')),
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_sent_at ON public.user_notifications(sent_at);
CREATE INDEX idx_user_notifications_message_type ON public.user_notifications(message_type);

-- Add last_dashboard_visit to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_dashboard_visit TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_profiles_last_dashboard_visit ON public.profiles(last_dashboard_visit);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity
CREATE POLICY "Users can view their own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Create retention stats function for developer dashboard
CREATE OR REPLACE FUNCTION public.get_retention_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  date DATE,
  active_count BIGINT,
  at_risk_count BIGINT,
  dormant_count BIGINT,
  total_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(tag_updated_at) as date,
    COUNT(*) FILTER (WHERE tag = 'active') as active_count,
    COUNT(*) FILTER (WHERE tag = 'at_risk') as at_risk_count,
    COUNT(*) FILTER (WHERE tag = 'dormant') as dormant_count,
    COUNT(*) as total_users
  FROM user_activity
  WHERE tag_updated_at BETWEEN start_date AND end_date
  GROUP BY DATE(tag_updated_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cron job to run daily at 8:00 AM
SELECT cron.schedule(
  'daily-retention-monitoring',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mpzqlidtvlbijloeusuj.supabase.co/functions/v1/process-retention-monitoring',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenFsaWR0dmxiaWpsb2V1c3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjU0NzksImV4cCI6MjA2NjY0MTQ3OX0.BN01gE1yW8sIsWE7UMykMxYTOHzb2gZ5A2mFaB219YU"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);