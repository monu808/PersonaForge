-- Add buyer_id field to service_purchases table to link purchases to users
-- This allows us to query purchases by user ID while keeping wallet address for blockchain reference

ALTER TABLE service_purchases 
ADD COLUMN buyer_id UUID REFERENCES auth.users(id);

-- Create index for better performance on buyer_id queries
CREATE INDEX idx_service_purchases_buyer_id ON service_purchases(buyer_id);

-- Update the RLS policy to allow users to see their purchases via buyer_id
DROP POLICY IF EXISTS "Users can view relevant purchases" ON service_purchases;

CREATE POLICY "Users can view relevant purchases" ON service_purchases
  FOR SELECT USING (
    -- Users can see purchases they made (by user ID)
    buyer_id = auth.uid() OR
    -- Users can see purchases of their wallet address
    buyer_wallet = (
      SELECT wallet_address FROM auth.users WHERE id = auth.uid()
    ) OR
    -- Users can see purchases of services they own
    EXISTS (
      SELECT 1 FROM persona_services ps
      JOIN personas p ON ps.persona_id = p.id
      WHERE ps.id = service_purchases.service_id
      AND p.user_id = auth.uid()
    )
  );

-- Update existing records to set buyer_id based on wallet_address
-- This is a best-effort update for any existing records
UPDATE service_purchases 
SET buyer_id = (
  SELECT id FROM auth.users 
  WHERE wallet_address = service_purchases.buyer_wallet
)
WHERE buyer_id IS NULL;
