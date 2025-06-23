-- Add service delivery and access features
-- Migration: 20250619000005_add_service_delivery.sql

-- Add service_type and delivery_content to persona_services
ALTER TABLE persona_services 
ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('consultation', 'video', 'image', 'text', 'voice_message', 'custom')) DEFAULT 'consultation',
ADD COLUMN IF NOT EXISTS delivery_content TEXT, -- For storing text content, file URLs, or instructions
ADD COLUMN IF NOT EXISTS delivery_url TEXT, -- For storing video/image URLs
ADD COLUMN IF NOT EXISTS file_type TEXT, -- For storing file type (mp4, jpg, png, txt, etc.)
ADD COLUMN IF NOT EXISTS auto_delivery BOOLEAN DEFAULT false; -- Whether content is delivered automatically

-- Create user_persona_access table to track what personas/services users have access to
CREATE TABLE IF NOT EXISTS user_persona_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  persona_id UUID NOT NULL REFERENCES personas(id),
  service_id TEXT NOT NULL REFERENCES persona_services(id),
  purchase_id TEXT NOT NULL REFERENCES service_purchases(id),
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE, -- For time-limited access
  access_type TEXT NOT NULL CHECK (access_type IN ('full', 'limited', 'expired')) DEFAULT 'full',
  usage_count INTEGER DEFAULT 0, -- Track how many times service was used
  max_usage INTEGER, -- Maximum number of uses (for limited services)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_deliveries table to track content delivery
CREATE TABLE IF NOT EXISTS service_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id TEXT NOT NULL REFERENCES service_purchases(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  service_id TEXT NOT NULL REFERENCES persona_services(id),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('automatic', 'manual', 'download', 'stream')),
  content_url TEXT, -- URL to delivered content
  content_text TEXT, -- Text content for text-based services
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'expired')) DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3, -- Limit downloads for security
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_persona_access_user_id ON user_persona_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_persona_access_persona_id ON user_persona_access(persona_id);
CREATE INDEX IF NOT EXISTS idx_user_persona_access_service_id ON user_persona_access(service_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_user_id ON service_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_purchase_id ON service_deliveries(purchase_id);

-- RLS Policies for user_persona_access
ALTER TABLE user_persona_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access" ON user_persona_access
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage access" ON user_persona_access
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- RLS Policies for service_deliveries  
ALTER TABLE service_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deliveries" ON service_deliveries
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage deliveries" ON service_deliveries
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON user_persona_access TO authenticated;
GRANT ALL ON service_deliveries TO authenticated;
