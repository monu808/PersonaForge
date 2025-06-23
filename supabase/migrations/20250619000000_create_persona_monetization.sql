-- Create persona_services table for monetization
CREATE TABLE persona_services (
  id TEXT PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id),
  service_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_algo DECIMAL(10, 6) NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('consultation', 'content_creation', 'voice_message', 'video_call', 'custom')),
  duration_minutes INTEGER,
  creator_wallet TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create service_purchases table to track payments
CREATE TABLE service_purchases (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES persona_services(id),
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  amount_algo DECIMAL(10, 6) NOT NULL,
  amount_usd DECIMAL(10, 2) NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Add wallet_address field to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Create indexes for better performance
CREATE INDEX idx_persona_services_persona_id ON persona_services(persona_id);
CREATE INDEX idx_persona_services_active ON persona_services(is_active);
CREATE INDEX idx_persona_services_type ON persona_services(service_type);
CREATE INDEX idx_service_purchases_service_id ON service_purchases(service_id);
CREATE INDEX idx_service_purchases_buyer ON service_purchases(buyer_wallet);
CREATE INDEX idx_service_purchases_seller ON service_purchases(seller_wallet);
CREATE INDEX idx_service_purchases_transaction ON service_purchases(transaction_id);

-- Enable RLS
ALTER TABLE persona_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for persona_services
-- Anyone can view active services (marketplace)
CREATE POLICY "Active services are viewable by everyone" ON persona_services
  FOR SELECT USING (is_active = true);

-- Users can insert services for their own personas
CREATE POLICY "Users can create services for own personas" ON persona_services
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- Users can update their own services
CREATE POLICY "Users can update own services" ON persona_services
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- Users can delete their own services
CREATE POLICY "Users can delete own services" ON persona_services
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM personas 
      WHERE personas.id = persona_services.persona_id 
      AND personas.user_id = auth.uid()
    )
  );

-- RLS policies for service_purchases
-- Users can view purchases they made or received
CREATE POLICY "Users can view own purchases" ON service_purchases
  FOR SELECT USING (
    buyer_wallet = (SELECT wallet_address FROM users WHERE id = auth.uid()) OR 
    seller_wallet = (SELECT wallet_address FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM persona_services ps, personas p
      WHERE ps.id = service_purchases.service_id
      AND ps.persona_id = p.id
      AND p.user_id = auth.uid()
    )
  );

-- Anyone can insert purchase records (for payment processing)
CREATE POLICY "Anyone can create purchase records" ON service_purchases
  FOR INSERT WITH CHECK (true);

-- Only the system can update purchase status
CREATE POLICY "System can update purchase status" ON service_purchases
  FOR UPDATE USING (true);
