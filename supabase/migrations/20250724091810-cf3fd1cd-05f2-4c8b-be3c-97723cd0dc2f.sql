
-- Create or update the handle_new_user function to generate unique store handles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
    COALESCE(NEW.raw_user_meta_data->>'store_handle', LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.email), ' ', ''))),
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
$function$
