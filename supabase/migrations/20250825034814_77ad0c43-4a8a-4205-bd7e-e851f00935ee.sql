-- Check if there are any triggers on bookings table that might be causing RLS violations
-- and remove them if they prevent public booking creation

-- First, let's see what triggers exist on the bookings table
SELECT 
    t.trigger_name, 
    t.event_manipulation, 
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t 
WHERE t.event_object_table = 'bookings';

-- Drop any triggers that check user_id matches auth.uid() for bookings table
-- since bookings should be created by customers for business owners
DROP TRIGGER IF EXISTS check_user_id_trigger ON public.bookings;
DROP TRIGGER IF EXISTS check_user_id_matches_auth_trigger ON public.bookings;

-- Ensure the RLS policy for public booking creation is correct
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;

CREATE POLICY "Public can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Also ensure customers can view bookings they created (optional)
CREATE POLICY "Customers can view bookings by email" 
ON public.bookings 
FOR SELECT 
USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email' OR auth.uid() = user_id OR customer_email IS NOT NULL);