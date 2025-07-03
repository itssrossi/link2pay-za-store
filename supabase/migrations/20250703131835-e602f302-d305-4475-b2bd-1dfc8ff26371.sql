-- Add Gupshup fields to platform_settings table
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS gupshup_api_key text DEFAULT 'd3vozumtgbdhhnkv0lbeturjammx7rf0',
ADD COLUMN IF NOT EXISTS gupshup_source_phone text DEFAULT '15557961325';

-- Update any existing row with the Gupshup credentials
UPDATE platform_settings 
SET 
  gupshup_api_key = 'd3vozumtgbdhhnkv0lbeturjammx7rf0',
  gupshup_source_phone = '15557961325'
WHERE gupshup_api_key IS NULL OR gupshup_source_phone IS NULL;