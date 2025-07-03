-- Add PayFast credentials fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payfast_merchant_id text,
ADD COLUMN IF NOT EXISTS payfast_merchant_key text,
ADD COLUMN IF NOT EXISTS payfast_passphrase text,
ADD COLUMN IF NOT EXISTS payfast_mode text DEFAULT 'sandbox' CHECK (payfast_mode IN ('sandbox', 'live'));