
-- Update the handle_new_user function to handle duplicate store handles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  base_handle TEXT;
  final_handle TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base handle from business name or email
  base_handle := LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.email), ' ', ''));
  base_handle := REGEXP_REPLACE(base_handle, '[^a-z0-9]', '', 'g'); -- Remove special characters
  
  -- Start with the base handle
  final_handle := base_handle;
  
  -- Check if handle exists and increment counter until we find a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE store_handle = final_handle) LOOP
    counter := counter + 1;
    final_handle := base_handle || counter::TEXT;
  END LOOP;
  
  -- Insert the profile with unique handle
  INSERT INTO public.profiles (id, business_name, store_handle, whatsapp_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', '')
  );
  
  RETURN NEW;
END;
$$;
