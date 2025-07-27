
-- Add the missing full_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update the handle_new_user function to properly handle all columns and edge cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_handle TEXT;
  unique_handle TEXT;
  counter INTEGER := 1;
  business_name_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Extract values from metadata with fallbacks
  business_name_val := COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business');
  full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
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
  
  -- Insert the profile with all required fields
  INSERT INTO public.profiles (
    id, 
    business_name, 
    full_name,
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
    unique_handle,
    now() + interval '7 days',
    false,
    now(),
    now()
  );
  
  -- Create trial start transaction
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are properly configured
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Public visibility policies
DROP POLICY IF EXISTS "Public can view visible store profiles" ON public.profiles;
CREATE POLICY "Public can view visible store profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (store_visibility = true);

DROP POLICY IF EXISTS "Anyone can view public store profiles" ON public.profiles;
CREATE POLICY "Anyone can view public store profiles" 
  ON public.profiles 
  FOR SELECT 
  USING ((store_handle IS NOT NULL) AND (store_handle <> ''));
