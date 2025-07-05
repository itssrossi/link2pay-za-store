
-- Add store location address field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN store_address TEXT;

-- Add Capitec Pay Me link fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN capitec_paylink TEXT,
ADD COLUMN show_capitec BOOLEAN DEFAULT false;
