-- Fix RLS policies to allow user insertion into user_persona_access
-- Migration: 20250619000015_fix_user_access_policies.sql

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Service role can manage access" ON user_persona_access;
DROP POLICY IF EXISTS "Service role can manage deliveries" ON service_deliveries;

-- Allow authenticated users to insert their own access records after purchase
CREATE POLICY "Users can insert their own access" ON user_persona_access
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own access records
CREATE POLICY "Users can update their own access" ON user_persona_access
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role full access for system operations
CREATE POLICY "Service role full access" ON user_persona_access
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Allow authenticated users to insert their own delivery records
CREATE POLICY "Users can insert their own deliveries" ON service_deliveries
  FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own deliveries  
CREATE POLICY "Users can update their own deliveries" ON service_deliveries
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow service role full access for delivery management
CREATE POLICY "Service role full delivery access" ON service_deliveries
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Ensure the tables are properly accessible
GRANT ALL ON user_persona_access TO authenticated;
GRANT ALL ON service_deliveries TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
