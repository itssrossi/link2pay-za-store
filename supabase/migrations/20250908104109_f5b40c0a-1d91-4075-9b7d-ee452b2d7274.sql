-- Add new onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_choice text CHECK (onboarding_choice IN ('physical_products', 'bookings')),
ADD COLUMN IF NOT EXISTS glowing_invoice_tab boolean DEFAULT false;

-- Update the whatsapp_number column to be NOT NULL for new users
-- We can't modify existing records, but we'll handle this in the signup process

-- Create a trigger to ensure whatsapp_number is provided for new signups
CREATE OR REPLACE FUNCTION public.validate_whatsapp_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate for new inserts, not updates
  IF TG_OP = 'INSERT' AND (NEW.whatsapp_number IS NULL OR NEW.whatsapp_number = '') THEN
    RAISE EXCEPTION 'WhatsApp number is required for new accounts';
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to validate whatsapp_number on insert
DROP TRIGGER IF EXISTS validate_whatsapp_trigger ON public.profiles;
CREATE TRIGGER validate_whatsapp_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_whatsapp_number();

-- Update the handle_new_user function to extract whatsapp_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  base_handle TEXT;
  unique_handle TEXT;
  counter INTEGER := 1;
  business_name_val TEXT;
  full_name_val TEXT;
  whatsapp_number_val TEXT;
BEGIN
  -- Extract values from metadata with fallbacks
  business_name_val := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  whatsapp_number_val := COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', '');
  
  -- Validate whatsapp_number is provided
  IF whatsapp_number_val = '' OR whatsapp_number_val IS NULL THEN
    RAISE EXCEPTION 'WhatsApp number is required for account creation';
  END IF;
  
  -- Generate base handle from business name
  base_handle := LOWER(REGEXP_REPLACE(business_name_val, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure base handle is not empty and limit length
  IF base_handle = '' OR base_handle IS NULL THEN
    base_handle := 'store';
  END IF;
  
  base_handle := SUBSTRING(base_handle, 1, 20);
  unique_handle := base_handle;
  
  -- Find a unique handle
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE store_handle = unique_handle) LOOP
    unique_handle := base_handle || counter::TEXT;
    counter := counter + 1;
    
    -- Safety check to prevent infinite loops
    IF counter > 1000 THEN
      unique_handle := base_handle || extract(epoch from now())::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  -- Only insert if profile doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Insert the profile with all required fields including whatsapp_number
    INSERT INTO public.profiles (
      id, 
      business_name, 
      full_name,
      whatsapp_number,
      store_handle,
      trial_ends_at,
      has_active_subscription,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      business_name_val,
      full_name_val,
      whatsapp_number_val,
      unique_handle,
      now() + interval '7 days',
      false,
      now(),
      now()
    );
    
    -- Create trial start transaction only if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM public.subscription_transactions 
      WHERE user_id = NEW.id AND transaction_type = 'trial_start'
    ) THEN
      INSERT INTO public.subscription_transactions (
        user_id,
        transaction_type,
        status,
        reference,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        'trial_start',
        'completed',
        'Free trial started',
        now(),
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;