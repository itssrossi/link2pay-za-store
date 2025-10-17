-- Create user_rewards table
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_total INTEGER DEFAULT 0,
  points_weekly INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_safe_date DATE,
  has_seen_rewards_popup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create reward_activities log table
CREATE TABLE public.reward_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX idx_user_rewards_points ON public.user_rewards(points_total DESC);
CREATE INDEX idx_reward_activities_user_id ON public.reward_activities(user_id);
CREATE INDEX idx_reward_activities_created_at ON public.reward_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards"
  ON public.user_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON public.user_rewards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON public.user_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view top rewards for leaderboard"
  ON public.user_rewards FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT id FROM user_rewards 
      ORDER BY points_total DESC 
      LIMIT 100
    )
  );

-- RLS Policies for reward_activities
CREATE POLICY "Users can view their own reward activities"
  ON public.reward_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_rewards_timestamp
  BEFORE UPDATE ON public.user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rewards_updated_at();

-- Helper function for repeat customers
CREATE OR REPLACE FUNCTION get_repeat_customers_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  repeat_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT client_email)
  INTO repeat_count
  FROM invoices
  WHERE user_id = p_user_id
    AND status = 'paid'
    AND client_email IN (
      SELECT client_email
      FROM invoices
      WHERE user_id = p_user_id
        AND status = 'paid'
      GROUP BY client_email
      HAVING COUNT(*) > 1
    );
  
  RETURN COALESCE(repeat_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;