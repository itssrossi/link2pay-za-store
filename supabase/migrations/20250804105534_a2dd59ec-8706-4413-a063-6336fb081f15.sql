-- Add PayFast integration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payfast_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS payfast_merchant_key TEXT,
ADD COLUMN IF NOT EXISTS payfast_passphrase TEXT,
ADD COLUMN IF NOT EXISTS show_payfast_auto BOOLEAN DEFAULT false;