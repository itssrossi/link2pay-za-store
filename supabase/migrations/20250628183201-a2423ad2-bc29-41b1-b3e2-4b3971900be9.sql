
-- Add new columns to profiles table for enhanced store customization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_headline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_subheading TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_cta_text TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hero_cta_link TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preset TEXT DEFAULT 'clean';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_visibility BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'ZAR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS delivery_note TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customization_version INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_customized_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a new table for store sections and their settings
CREATE TABLE IF NOT EXISTS public.store_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  section_type TEXT NOT NULL, -- 'products', 'about', 'contact', 'testimonials', 'custom_html'
  is_enabled BOOLEAN DEFAULT true,
  section_title TEXT,
  section_content TEXT,
  section_order INTEGER DEFAULT 0,
  section_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for store_sections
ALTER TABLE public.store_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store sections" 
  ON public.store_sections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store sections" 
  ON public.store_sections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store sections" 
  ON public.store_sections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store sections" 
  ON public.store_sections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_store_sections_user_id ON public.store_sections(user_id);
CREATE INDEX IF NOT EXISTS idx_store_sections_type ON public.store_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_profiles_store_handle ON public.profiles(store_handle);

-- Insert default sections for existing users
INSERT INTO public.store_sections (user_id, section_type, is_enabled, section_title, section_order)
SELECT 
  id,
  'products',
  true,
  'Our Products',
  1
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_sections 
  WHERE user_id = profiles.id AND section_type = 'products'
);

INSERT INTO public.store_sections (user_id, section_type, is_enabled, section_title, section_order)
SELECT 
  id,
  'contact',
  true,
  'Contact Us',
  2
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.store_sections 
  WHERE user_id = profiles.id AND section_type = 'contact'
);
