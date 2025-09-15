-- Add unique constraint on user_id and section_type combination
-- This prevents users from having duplicate section types
ALTER TABLE public.store_sections 
ADD CONSTRAINT store_sections_user_section_unique 
UNIQUE (user_id, section_type);