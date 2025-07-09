
-- Let's check and fix the RLS policies for products table
-- First, drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can create products" ON public.products;
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

-- Recreate the policies with proper checks
CREATE POLICY "Users can create their own products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Also ensure the user_id column is NOT NULL to prevent issues
ALTER TABLE public.products ALTER COLUMN user_id SET NOT NULL;

-- Add a check to ensure user_id matches the authenticated user
CREATE OR REPLACE FUNCTION public.check_user_id_matches_auth()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce user_id validation
DROP TRIGGER IF EXISTS check_user_id_trigger ON public.products;
CREATE TRIGGER check_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_user_id_matches_auth();
