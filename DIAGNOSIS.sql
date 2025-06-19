-- DIAGNOSIS: Run this to check what's wrong
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if service_purchases table exists and its structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_purchases'
ORDER BY ordinal_position;

-- 2. Check RLS policies on service_purchases
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'service_purchases';

-- 3. Check if there are any records in service_purchases
SELECT COUNT(*) as total_records FROM service_purchases;

-- 4. Try a simple select as the current user (using correct column names)
SELECT id, buyer_id, buyer_wallet, service_id, purchase_date 
FROM service_purchases 
LIMIT 3;
