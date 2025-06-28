
-- Add store customization fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_layout TEXT DEFAULT 'grid';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_font TEXT DEFAULT 'inter';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4C9F70';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#3d8159';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS header_banner_url TEXT;

-- Ensure store_handle has a unique constraint
ALTER TABLE public.profiles ADD CONSTRAINT unique_store_handle UNIQUE (store_handle);

-- Add public access policy for profiles (needed for public storefront)
CREATE POLICY "Anyone can view public store profiles" ON public.profiles
  FOR SELECT USING (store_handle IS NOT NULL AND store_handle != '');
