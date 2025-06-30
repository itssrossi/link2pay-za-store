
-- Add columns to store payment button preferences for each invoice
ALTER TABLE public.invoices 
ADD COLUMN show_snapscan BOOLEAN DEFAULT false,
ADD COLUMN show_payfast BOOLEAN DEFAULT false;
