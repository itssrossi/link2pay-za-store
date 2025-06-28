
-- Update platform_settings table to include Zoko API credentials
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS zoko_api_key text,
ADD COLUMN IF NOT EXISTS zoko_business_phone text,
ADD COLUMN IF NOT EXISTS zoko_base_url text DEFAULT 'https://app.zoko.io/api/v2/messages/';

-- Update existing row with new columns
UPDATE platform_settings 
SET zoko_base_url = 'https://app.zoko.io/api/v2/messages/'
WHERE zoko_base_url IS NULL;
