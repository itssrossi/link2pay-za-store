
-- Add whatsapp_paid_sent field to invoices table to prevent duplicate payment confirmations
ALTER TABLE public.invoices 
ADD COLUMN whatsapp_paid_sent boolean DEFAULT false;

-- Add index for better performance on phone number lookups
CREATE INDEX IF NOT EXISTS idx_invoices_client_phone ON public.invoices(client_phone);
