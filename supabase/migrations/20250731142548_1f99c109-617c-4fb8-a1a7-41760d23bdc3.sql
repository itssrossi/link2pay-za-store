-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- in minutes
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create availability settings table
CREATE TABLE IF NOT EXISTS public.availability_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- Create booking time slots table
CREATE TABLE IF NOT EXISTS public.booking_time_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, time_slot)
);

-- Enable RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_time_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for availability settings
CREATE POLICY "Users can manage their availability" ON public.availability_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view availability" ON public.availability_settings
  FOR SELECT USING (true);

-- RLS policies for booking time slots
CREATE POLICY "Users can manage their time slots" ON public.booking_time_slots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view available time slots" ON public.booking_time_slots
  FOR SELECT USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_availability_settings_updated_at
  BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key reference for booking_time_slots
ALTER TABLE public.booking_time_slots 
ADD CONSTRAINT fk_booking_time_slots_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;