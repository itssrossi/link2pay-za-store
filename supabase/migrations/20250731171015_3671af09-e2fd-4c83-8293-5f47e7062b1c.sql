-- Update BETA50 code to reduce price to 50 rand (discount 45 rand from 95)
UPDATE promo_codes 
SET discount_amount = 45.00
WHERE code = 'BETA50';

-- Update DEVJOHN code to bypass all payments (discount full 95 rand)
UPDATE promo_codes 
SET discount_amount = 95.00
WHERE code = 'DEVJOHN';