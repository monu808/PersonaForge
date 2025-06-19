-- COMPLETE TABLE FIX: Add all missing columns and fix structure
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_purchases'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- If the table doesn't have proper timestamps, add them
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update created_at from purchase_date if it exists
UPDATE service_purchases 
SET created_at = purchase_date 
WHERE created_at IS NULL AND purchase_date IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_id ON service_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_service_purchases_created_at ON service_purchases(created_at);
CREATE INDEX IF NOT EXISTS idx_service_purchases_purchase_date ON service_purchases(purchase_date);

-- Verify the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_purchases'
ORDER BY ordinal_position;
