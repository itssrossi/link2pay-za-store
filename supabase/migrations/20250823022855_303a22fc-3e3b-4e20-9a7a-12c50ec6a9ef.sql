-- Update default subscription pricing from R95 to R152
ALTER TABLE public.profiles 
ALTER COLUMN subscription_amount SET DEFAULT 152.00,
ALTER COLUMN subscription_price SET DEFAULT 152.00;