-- Add columns to track user progress milestones
ALTER TABLE public.profiles 
ADD COLUMN first_invoice_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE NULL;