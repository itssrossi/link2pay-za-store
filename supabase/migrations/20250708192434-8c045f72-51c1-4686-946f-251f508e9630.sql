-- Add Twilio WhatsApp API credentials to platform_settings
ALTER TABLE platform_settings 
ADD COLUMN twilio_account_sid TEXT,
ADD COLUMN twilio_auth_token TEXT,
ADD COLUMN twilio_whatsapp_number TEXT;

-- Remove Gupshup-specific columns since we're switching to Twilio
ALTER TABLE platform_settings 
DROP COLUMN IF EXISTS gupshup_api_key,
DROP COLUMN IF EXISTS gupshup_source_phone;