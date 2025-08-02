-- Fix RLS policy for bookings table to allow inserts for anyone
-- This will allow customers to create bookings without authentication

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can create invoices" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Create a new policy that allows anyone to insert bookings
CREATE POLICY "Allow anonymous booking creation"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Ensure the existing policies for viewing and updating remain user-specific
-- (These should already exist but let's make sure)
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);