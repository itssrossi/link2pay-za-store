-- Add INSERT policy for reward_activities to allow users to log their own activities
CREATE POLICY "Users can create reward activities"
ON public.reward_activities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add unique index on user_rewards(user_id) to support upsert operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'user_rewards_user_id_key'
  ) THEN
    CREATE UNIQUE INDEX user_rewards_user_id_key ON public.user_rewards(user_id);
  END IF;
END
$$;