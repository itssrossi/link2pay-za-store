
-- Update platform_settings to have default Zoko API credentials
UPDATE platform_settings 
SET 
  zoko_api_key = 'your_zoko_api_key_here',
  zoko_business_phone = 'your_business_phone_here'
WHERE id IS NOT NULL;

-- Ensure there's always a default row with Zoko credentials
INSERT INTO platform_settings (zoko_api_key, zoko_business_phone, zoko_base_url)
SELECT 'your_zoko_api_key_here', 'your_business_phone_here', 'https://chat.zoko.io/v2/message'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);
