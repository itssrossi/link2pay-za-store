-- Create PayFast subscriptions table
CREATE TABLE IF NOT EXISTS public.payfast_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invoice_id TEXT NOT NULL,
  pf_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payfast_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own PayFast subscriptions" 
ON public.payfast_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PayFast subscriptions" 
ON public.payfast_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add PayFast fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS pf_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_amount NUMERIC DEFAULT 95.00,
ADD COLUMN IF NOT EXISTS trial_expired BOOLEAN DEFAULT false;

-- Create function to check if trial is expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id 
    AND trial_ends_at < now()
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update trial_expired status
CREATE OR REPLACE FUNCTION public.update_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trial_expired = (NEW.trial_ends_at < now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trial_status_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trial_status();