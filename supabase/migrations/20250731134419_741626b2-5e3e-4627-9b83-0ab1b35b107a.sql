-- Fix trial state consistency
UPDATE profiles 
SET trial_used = true 
WHERE trial_started_at IS NOT NULL AND trial_used = false;