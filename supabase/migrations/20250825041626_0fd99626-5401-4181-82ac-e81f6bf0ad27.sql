-- Fix bookings status check constraint to allow 'pending' and 'confirmed' values
DROP CONSTRAINT IF EXISTS bookings_status_check ON bookings;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));