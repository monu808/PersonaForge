-- IMMEDIATE FIX: Run this in Supabase SQL Editor
-- This will add the missing buyer_id column and fix the 400 error

-- Add buyer_id column to service_purchases table
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_id ON service_purchases(buyer_id);

-- Update RLS policies to work with buyer_id
DROP POLICY IF EXISTS "Users can view their purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can insert their purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can view relevant purchases" ON service_purchases;
DROP POLICY IF EXISTS "Authenticated users can create purchases" ON service_purchases;

-- Create new policy for viewing purchases
CREATE POLICY "Users can view their purchases" ON service_purchases
  FOR SELECT 
  USING (
    buyer_id = auth.uid() OR 
    buyer_wallet = (SELECT raw_user_meta_data->>'wallet_address' FROM auth.users WHERE id = auth.uid())
  );

-- Create new policy for inserting purchases  
CREATE POLICY "Users can insert their purchases" ON service_purchases
  FOR INSERT 
  WITH CHECK (buyer_id = auth.uid());

-- Allow service role to manage all purchases (only create if not exists)
DROP POLICY IF EXISTS "Service role can manage all purchases" ON service_purchases;
CREATE POLICY "Service role can manage all purchases" ON service_purchases
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON service_purchases TO authenticated;
GRANT USAGE ON SEQUENCE service_purchases_id_seq TO authenticated;
