-- Add missing columns to persona_services table
-- Date: 2025-06-23

ALTER TABLE persona_services 
ADD COLUMN uploaded_file TEXT,
ADD COLUMN file_type TEXT,
ADD COLUMN auto_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN duration_minutes INTEGER;

-- Update existing columns that might be missing
ALTER TABLE persona_services 
ADD COLUMN IF NOT EXISTS delivery_content TEXT,
ADD COLUMN IF NOT EXISTS delivery_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_persona_services_file_type ON persona_services(file_type);
CREATE INDEX IF NOT EXISTS idx_persona_services_auto_delivery ON persona_services(auto_delivery);
