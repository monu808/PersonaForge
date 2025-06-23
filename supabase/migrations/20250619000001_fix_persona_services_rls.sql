-- Fix RLS policies for persona_services to allow proper updates
-- This migration fixes the 403 Forbidden errors when updating services

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own services" ON persona_services;
DROP POLICY IF EXISTS "Active services are viewable by everyone" ON persona_services;

-- Create more permissive policies for development
-- Allow viewing all services (not just active ones) for admin/development
CREATE POLICY "All users can view services" ON persona_services
  FOR SELECT USING (true);

-- Allow users to update their own services with proper persona ownership check
CREATE POLICY "Users can update own services" ON persona_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- For development: Allow service creators to update their services by wallet address
CREATE POLICY "Service creators can update by wallet" ON persona_services
  FOR UPDATE USING (
    creator_wallet = (SELECT wallet_address FROM users WHERE id = auth.uid())
  ) WITH CHECK (
    creator_wallet = (SELECT wallet_address FROM users WHERE id = auth.uid())
  );
