-- Update BETA50 promo code to give R57 discount (from R152 to R95)
UPDATE public.promo_codes 
SET discount_amount = 57
WHERE code = 'BETA50' AND is_active = true;