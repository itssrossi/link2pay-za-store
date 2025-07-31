-- Add trial_started_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE;

-- Update existing users who have trial_ends_at but no trial_started_at
UPDATE public.profiles 
SET trial_started_at = trial_ends_at - interval '7 days'
WHERE trial_ends_at IS NOT NULL AND trial_started_at IS NULL;