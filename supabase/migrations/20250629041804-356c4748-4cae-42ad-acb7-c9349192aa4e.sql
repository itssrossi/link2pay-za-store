
-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public viewing of active products from visible stores
CREATE POLICY "Public can view active products from visible stores" 
ON public.products 
FOR SELECT 
TO public
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = products.user_id 
    AND profiles.store_visibility = true
  )
);

-- Also ensure profiles table has proper RLS for public storefront access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public access to visible store profiles
CREATE POLICY "Public can view visible store profiles" 
ON public.profiles 
FOR SELECT 
TO public
USING (store_visibility = true);

-- Allow public access to store sections for visible stores
ALTER TABLE public.store_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view sections from visible stores" 
ON public.store_sections 
FOR SELECT 
TO public
USING (
  is_enabled = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = store_sections.user_id 
    AND profiles.store_visibility = true
  )
);
