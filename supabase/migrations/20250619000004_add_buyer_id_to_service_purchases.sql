-- Add buyer_id column to service_purchases table to reference auth.users
ALTER TABLE service_purchases 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_id ON service_purchases(buyer_id);

-- Update RLS policies to work with buyer_id
DROP POLICY IF EXISTS "Users can view their purchases" ON service_purchases;
DROP POLICY IF EXISTS "Users can insert their purchases" ON service_purchases;

-- Create new RLS policies that use buyer_id
CREATE POLICY "Users can view their purchases" ON service_purchases
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Users can insert their purchases" ON service_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Service role policy (unchanged)
CREATE POLICY "Service role can manage all purchases" ON service_purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
