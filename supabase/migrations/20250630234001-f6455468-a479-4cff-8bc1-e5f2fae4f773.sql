
-- Update platform_settings with your actual Zoko API credentials
UPDATE platform_settings 
SET 
  zoko_api_key = 'd603f5a2-ee1e-4f74-a136-819dca41c979',
  zoko_business_phone = '15557739280',
  zoko_base_url = 'https://chat.zoko.io/v2/message'
WHERE id IS NOT NULL;

-- Ensure there's always a row with your Zoko credentials if none exists
INSERT INTO platform_settings (zoko_api_key, zoko_business_phone, zoko_base_url)
SELECT 'd603f5a2-ee1e-4f74-a136-819dca41c979', '15557739280', 'https://chat.zoko.io/v2/message'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);
