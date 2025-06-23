-- Fix RLS policies for user_persona_access and service_deliveries
-- Migration: 20250619000008_fix_rls_policies.sql

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own access" ON user_persona_access;
DROP POLICY IF EXISTS "Users can view their own deliveries" ON service_deliveries;

-- Create more permissive policies for user_persona_access
CREATE POLICY "Users can view their own access" ON user_persona_access
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own access" ON user_persona_access
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own access" ON user_persona_access
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create more permissive policies for service_deliveries
CREATE POLICY "Users can view their own deliveries" ON service_deliveries
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own deliveries" ON service_deliveries
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own deliveries" ON service_deliveries
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Additional policies to allow service creators to manage access for their services
CREATE POLICY "Service creators can manage access for their services" ON user_persona_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM persona_services ps 
      JOIN personas p ON p.id = ps.persona_id 
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM persona_services ps 
      JOIN personas p ON p.id = ps.persona_id 
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Service creators can manage deliveries for their services" ON service_deliveries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM persona_services ps 
      JOIN personas p ON p.id = ps.persona_id 
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM persona_services ps 
      JOIN personas p ON p.id = ps.persona_id 
      WHERE ps.id = service_id AND p.user_id = auth.uid()
    )
  );

-- Ensure proper permissions
GRANT ALL ON user_persona_access TO authenticated;
GRANT ALL ON service_deliveries TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
