-- Fix RLS policies for persona_services table to allow updates
-- Date: 2025-06-19

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only view their own persona services" ON persona_services;
DROP POLICY IF EXISTS "Users can only create their own persona services" ON persona_services;
DROP POLICY IF EXISTS "Users can only update their own persona services" ON persona_services;
DROP POLICY IF EXISTS "Users can only delete their own persona services" ON persona_services;

-- Create more permissive policies

-- Allow users to view all persona services (for marketplace)
CREATE POLICY "Anyone can view persona services" ON persona_services
  FOR SELECT USING (true);

-- Allow authenticated users to create persona services for their personas
CREATE POLICY "Authenticated users can create persona services" ON persona_services
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- Allow users to update their own persona services
CREATE POLICY "Users can update their own persona services" ON persona_services
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

-- Allow users to delete their own persona services
CREATE POLICY "Users can delete their own persona services" ON persona_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- Also ensure service_purchases table has proper policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can create purchases" ON service_purchases;

-- Allow users to view purchases they made or services they own
CREATE POLICY "Users can view relevant purchases" ON service_purchases
  FOR SELECT USING (
    buyer_wallet = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM persona_services ps
      JOIN personas p ON ps.persona_id = p.id
      WHERE ps.id = service_purchases.service_id
      AND p.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create purchases
CREATE POLICY "Authenticated users can create purchases" ON service_purchases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT ALL ON persona_services TO authenticated;
GRANT ALL ON service_purchases TO authenticated;
GRANT USAGE ON SEQUENCE persona_services_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE service_purchases_id_seq TO authenticated;
