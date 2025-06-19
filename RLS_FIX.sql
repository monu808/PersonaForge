-- RLS POLICY FIX: Run this to fix Row Level Security policies
-- Run this in Supabase SQL Editor

-- Drop existing policies that might be blocking the query
DROP POLICY IF EXISTS "Users can view their purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can view relevant purchases" ON service_purchases;

-- Create a simple policy that allows users to view their own purchases
CREATE POLICY "Users can view their purchases" ON service_purchases
  FOR SELECT 
  USING (buyer_id = auth.uid());

-- Create a policy for inserting purchases
DROP POLICY IF EXISTS "Users can insert their purchases" ON service_purchases;
CREATE POLICY "Users can insert their purchases" ON service_purchases
  FOR INSERT 
  WITH CHECK (buyer_id = auth.uid());

-- Test the query manually (replace the UUID with your actual user ID)
-- SELECT id, buyer_id, service_id FROM service_purchases WHERE buyer_id = 'adb771b6-b568-4b4c-a03f-8236b8950933';
