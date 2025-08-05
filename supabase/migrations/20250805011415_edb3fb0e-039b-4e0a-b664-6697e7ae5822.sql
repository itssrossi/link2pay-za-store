-- Fix RLS policies for bookings table to allow public booking creation
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Create new policies that properly handle public booking creation
-- Allow anyone to create bookings (public facing)
CREATE POLICY "Public can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

-- Allow store owners to view bookings for their store
CREATE POLICY "Store owners can view their bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow store owners to update their bookings
CREATE POLICY "Store owners can update their bookings" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow store owners to delete their bookings
CREATE POLICY "Store owners can delete their bookings" 
ON public.bookings 
FOR DELETE 
USING (auth.uid() = user_id);