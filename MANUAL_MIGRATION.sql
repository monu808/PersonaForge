-- Manual migration to fix service_purchases table
-- Run this in your Supabase SQL editor if migrations aren't working

-- Add buyer_id column to service_purchases table
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_id ON service_purchases(buyer_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view their purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can insert their purchases" ON service_purchases;

-- Create new policies that work with buyer_id
CREATE POLICY "Users can view their purchases" ON service_purchases
  FOR SELECT 
  USING (buyer_id = auth.uid() OR buyer_wallet = (SELECT raw_user_meta_data->>'wallet_address' FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their purchases" ON service_purchases
  FOR INSERT 
  WITH CHECK (buyer_id = auth.uid());

-- Allow service role to manage all purchases
CREATE POLICY "Service role can manage all purchases" ON service_purchases
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON service_purchases TO authenticated;
GRANT USAGE ON SEQUENCE service_purchases_id_seq TO authenticated;

-- Update existing records to set buyer_id (if you have existing data)
-- This query links existing purchases to users based on wallet address
-- UPDATE service_purchases 
-- SET buyer_id = (
--   SELECT id FROM auth.users 
--   WHERE raw_user_meta_data->>'wallet_address' = service_purchases.buyer_wallet
-- )
-- WHERE buyer_id IS NULL;
