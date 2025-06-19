-- SIMPLIFIED FIX: Just add the missing column
-- Run this in Supabase SQL Editor

-- Add buyer_id column to service_purchases table
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_id ON service_purchases(buyer_id);

-- Grant necessary permissions
GRANT ALL ON service_purchases TO authenticated;
GRANT USAGE ON SEQUENCE service_purchases_id_seq TO authenticated;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_purchases' 
AND column_name = 'buyer_id';
