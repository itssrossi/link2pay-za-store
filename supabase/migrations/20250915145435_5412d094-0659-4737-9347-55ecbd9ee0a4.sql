-- Add tip_popup_shown field to profiles table to track if user has seen the tip popup
ALTER TABLE public.profiles 
ADD COLUMN tip_popup_shown BOOLEAN DEFAULT false;