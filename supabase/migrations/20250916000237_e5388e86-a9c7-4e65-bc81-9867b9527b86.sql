-- Update handle_new_user function to enroll users in drip campaigns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    -- Insert the profile with all required fields including whatsapp_number and email
    INSERT INTO public.profiles (
      id, 
      business_name, 
      full_name,
      email,
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
      NEW.email,
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
    
    -- Enroll user in drip email campaigns
    PERFORM public.enroll_user_in_drip_campaigns(NEW.id);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;