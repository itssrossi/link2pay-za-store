
-- Add payment and delivery fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS snapscan_link TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payfast_link TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eft_details TEXT;

-- Add delivery method to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'Local Pickup';

-- Add delivery method and payment settings to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'Local Pickup';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS auto_reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create invoice reminders table for tracking
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_reminders table
ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoice_reminders
CREATE POLICY "Users can view their own invoice reminders" ON public.invoice_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_reminders.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own invoice reminders" ON public.invoice_reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE invoices.id = invoice_reminders.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );
