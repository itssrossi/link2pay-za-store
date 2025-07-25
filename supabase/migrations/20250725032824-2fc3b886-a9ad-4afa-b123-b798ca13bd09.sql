
-- Remove duplicate unique constraint on store_handle if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_store_handle_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_store_handle_key;
    END IF;
END $$;

-- Ensure we have a proper unique constraint on store_handle
ALTER TABLE profiles ADD CONSTRAINT profiles_store_handle_unique UNIQUE (store_handle);

-- Update the handle_new_user function to handle unique constraint violations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  base_handle TEXT;
  unique_handle TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base handle from business name or email
  base_handle := COALESCE(
    LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.email), '[^a-zA-Z0-9]', '', 'g')),
    'store'
  );
  
  -- Ensure base handle is not empty and limit length
  IF base_handle = '' THEN
    base_handle := 'store';
  END IF;
  
  base_handle := SUBSTRING(base_handle, 1, 20);
  unique_handle := base_handle;
  
  -- Find a unique handle
  WHILE EXISTS (SELECT 1 FROM profiles WHERE store_handle = unique_handle) LOOP
    unique_handle := base_handle || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  -- Insert the profile with the unique handle
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
    unique_handle,
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
$function$;
