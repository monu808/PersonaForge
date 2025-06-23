-- Run this SQL in your Supabase SQL editor to fix the persona_services table

-- Add missing columns to persona_services table
ALTER TABLE persona_services 
ADD COLUMN IF NOT EXISTS uploaded_file TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS auto_delivery BOOLEAN DEFAULT FALSE;

-- These columns might already exist from previous migrations, so we use IF NOT EXISTS
ALTER TABLE persona_services 
ADD COLUMN IF NOT EXISTS delivery_content TEXT,
ADD COLUMN IF NOT EXISTS delivery_url TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_persona_services_file_type ON persona_services(file_type);
CREATE INDEX IF NOT EXISTS idx_persona_services_auto_delivery ON persona_services(auto_delivery);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'persona_services' 
AND table_schema = 'public'
ORDER BY ordinal_position;
