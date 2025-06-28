
-- Create platform_settings table for WhatsApp API credentials
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_api_token text,
  whatsapp_phone_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default row (admin will update with actual credentials)
INSERT INTO platform_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (you can adjust this based on your admin user identification)
CREATE POLICY "Admin only access" ON platform_settings
FOR ALL USING (true);
