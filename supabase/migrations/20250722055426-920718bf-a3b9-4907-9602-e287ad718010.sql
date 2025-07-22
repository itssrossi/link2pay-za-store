
-- Add the devjohn promo code for developer bypass
INSERT INTO promo_codes (code, discount_amount, is_active, max_uses)
VALUES ('DEVJOHN', 95.00, true, 1)
ON CONFLICT (code) DO NOTHING;
