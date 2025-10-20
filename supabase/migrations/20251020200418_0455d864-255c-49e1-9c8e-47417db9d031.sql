-- Fix RLS causing infinite recursion on user_rewards selects
-- The existing policy "Anyone can view top rewards for leaderboard" references the same table in its USING expression,
-- which triggers Postgres error 42P17 (infinite recursion) on normal selects.
-- Drop the problematic policy to restore normal reads for users' own rows.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_rewards'
      AND policyname = 'Anyone can view top rewards for leaderboard'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can view top rewards for leaderboard" ON public.user_rewards';
  END IF;
END
$$;

-- Note: Leaderboard access will be handled separately via a dedicated RPC/Edge Function to avoid recursive RLS.
