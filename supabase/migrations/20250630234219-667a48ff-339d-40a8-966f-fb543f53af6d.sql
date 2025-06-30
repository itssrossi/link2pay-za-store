
-- Clear all user data to allow fresh signup and onboarding
-- This will remove all users and their associated data

-- First, delete all user-related data in the correct order to avoid foreign key constraints
DELETE FROM public.invoice_items WHERE invoice_id IN (SELECT id FROM public.invoices);
DELETE FROM public.invoice_reminders WHERE invoice_id IN (SELECT id FROM public.invoices);
DELETE FROM public.invoices;
DELETE FROM public.products;
DELETE FROM public.store_sections;
DELETE FROM public.profiles;

-- Finally, delete all users from the auth schema (this requires admin privileges)
DELETE FROM auth.users;
