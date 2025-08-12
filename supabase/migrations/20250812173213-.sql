-- Fix the RLS policy for public booking creation
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;

-- Create the correct policy that allows anyone to create bookings
CREATE POLICY "Public can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);