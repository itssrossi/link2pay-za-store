-- Update Gupshup WhatsApp credentials with new values
UPDATE platform_settings 
SET 
  gupshup_api_key = 'sk_82bc8710c7f24109b4bdef078a99450a',
  gupshup_source_phone = '15557708788',
  updated_at = now()
WHERE id = (SELECT id FROM platform_settings LIMIT 1);

-- Insert if no record exists
INSERT INTO platform_settings (gupshup_api_key, gupshup_source_phone)
SELECT 'sk_82bc8710c7f24109b4bdef078a99450a', '15557708788'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);