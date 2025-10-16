-- Add personalization prompt tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS prompt_logo_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prompt_products_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prompt_quick_invoice_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quick_invoice_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dashboard_visit_count INTEGER DEFAULT 0;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_profiles_prompt_flags 
ON public.profiles(prompt_logo_dismissed, prompt_products_dismissed, prompt_quick_invoice_dismissed);

-- Add comment
COMMENT ON COLUMN public.profiles.dashboard_visit_count IS 'Tracks number of dashboard visits for prompt logic';
COMMENT ON COLUMN public.profiles.quick_invoice_used IS 'Tracks if user has used the quick invoice feature';
COMMENT ON COLUMN public.profiles.prompt_logo_dismissed IS 'Tracks if user dismissed the logo prompt';
COMMENT ON COLUMN public.profiles.prompt_products_dismissed IS 'Tracks if user dismissed the products prompt';
COMMENT ON COLUMN public.profiles.prompt_quick_invoice_dismissed IS 'Tracks if user dismissed the quick invoice prompt';