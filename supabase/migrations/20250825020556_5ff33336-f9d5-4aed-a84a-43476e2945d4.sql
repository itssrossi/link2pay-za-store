-- Extend profiles table with booking payment settings
ALTER TABLE public.profiles 
ADD COLUMN booking_payments_enabled boolean DEFAULT false,
ADD COLUMN default_booking_deposit numeric DEFAULT 0,
ADD COLUMN allow_product_selection_bookings boolean DEFAULT true;

-- Extend bookings table with payment tracking
ALTER TABLE public.bookings 
ADD COLUMN payment_status text DEFAULT 'not_required' CHECK (payment_status IN ('pending', 'paid', 'failed', 'not_required')),
ADD COLUMN product_ids text[],
ADD COLUMN amount_due numeric DEFAULT 0,
ADD COLUMN amount_paid numeric DEFAULT 0,
ADD COLUMN balance_due_at timestamp with time zone,
ADD COLUMN payfast_payment_id text,
ADD COLUMN payment_data jsonb;

-- Create booking_transactions table for payment tracking
CREATE TABLE public.booking_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'full', 'balance')),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payfast_payment_id text,
  payfast_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on booking_transactions
ALTER TABLE public.booking_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for booking_transactions
CREATE POLICY "Users can view their own booking transactions" 
ON public.booking_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking transactions" 
ON public.booking_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking transactions" 
ON public.booking_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_booking_transactions_updated_at
BEFORE UPDATE ON public.booking_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();