-- Add missing payfast_billing_token column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payfast_billing_token TEXT;