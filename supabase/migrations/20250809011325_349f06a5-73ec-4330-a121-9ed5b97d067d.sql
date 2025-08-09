-- Insert BETA5 promo code that reduces subscription to 5 rand
INSERT INTO public.promo_codes (
  code,
  discount_amount,
  is_active,
  max_uses,
  expires_at
) VALUES (
  'BETA5',
  90.00, -- Discount 90 rand from the 95 rand subscription to make it 5 rand
  true,
  100, -- Allow 100 uses for testing
  now() + interval '30 days' -- Expires in 30 days
) ON CONFLICT (code) DO UPDATE SET
  discount_amount = EXCLUDED.discount_amount,
  is_active = EXCLUDED.is_active,
  max_uses = EXCLUDED.max_uses,
  expires_at = EXCLUDED.expires_at;