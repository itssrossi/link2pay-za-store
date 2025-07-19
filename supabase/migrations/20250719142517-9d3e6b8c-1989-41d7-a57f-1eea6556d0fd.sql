
-- Add subscription-related fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS has_active_subscription boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS payfast_billing_token text,
ADD COLUMN IF NOT EXISTS subscription_price numeric DEFAULT 95.00,
ADD COLUMN IF NOT EXISTS billing_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS discount_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS billing_failures integer DEFAULT 0;

-- Create subscription_transactions table to track billing history
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('trial_start', 'subscription_payment', 'cancellation')),
  amount numeric,
  payfast_payment_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on subscription_transactions
ALTER TABLE subscription_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_transactions
CREATE POLICY "Users can view their own subscription transactions"
ON subscription_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscription transactions"
ON subscription_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_amount numeric NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert the BETA50 promo code
INSERT INTO promo_codes (code, discount_amount, is_active, max_uses)
VALUES ('BETA50', 45.00, true, 1000)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on promo_codes (public read access for validation)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
ON promo_codes FOR SELECT
USING (is_active = true);

-- Update the handle_new_user function to set trial period
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    business_name, 
    store_handle,
    trial_ends_at,
    has_active_subscription
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.email), ' ', '')),
    now() + interval '7 days',
    false
  );
  
  -- Create trial start transaction
  INSERT INTO public.subscription_transactions (
    user_id,
    transaction_type,
    status,
    reference
  ) VALUES (
    NEW.id,
    'trial_start',
    'completed',
    'Free trial started'
  );
  
  RETURN NEW;
END;
$$;
