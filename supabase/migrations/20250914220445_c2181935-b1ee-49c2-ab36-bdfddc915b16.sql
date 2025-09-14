-- Add first_sign_in_completed field to profiles table to track if user has completed their first sign-in
ALTER TABLE public.profiles 
ADD COLUMN first_sign_in_completed boolean DEFAULT false;