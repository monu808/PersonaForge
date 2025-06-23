-- Fix service ID type mismatch: Convert TEXT to UUID
-- Migration: 20250619000010_fix_service_id_types.sql

-- First, disable foreign key constraints temporarily
ALTER TABLE service_purchases DROP CONSTRAINT IF EXISTS service_purchases_service_id_fkey;
ALTER TABLE user_persona_access DROP CONSTRAINT IF EXISTS user_persona_access_service_id_fkey;
ALTER TABLE service_deliveries DROP CONSTRAINT IF EXISTS service_deliveries_service_id_fkey;

-- Update persona_services.id from TEXT to UUID
-- First add a new UUID column
ALTER TABLE persona_services ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Update all existing records to have proper UUIDs
UPDATE persona_services SET new_id = gen_random_uuid() WHERE new_id IS NULL;

-- Make the new column NOT NULL
ALTER TABLE persona_services ALTER COLUMN new_id SET NOT NULL;

-- Update all referencing tables to use the new UUID
-- service_purchases
ALTER TABLE service_purchases ADD COLUMN new_service_id UUID;
UPDATE service_purchases 
SET new_service_id = ps.new_id 
FROM persona_services ps 
WHERE service_purchases.service_id = ps.id;

-- user_persona_access
ALTER TABLE user_persona_access ADD COLUMN new_service_id UUID;
UPDATE user_persona_access 
SET new_service_id = ps.new_id 
FROM persona_services ps 
WHERE user_persona_access.service_id = ps.id;

-- service_deliveries
ALTER TABLE service_deliveries ADD COLUMN new_service_id UUID;
UPDATE service_deliveries 
SET new_service_id = ps.new_id 
FROM persona_services ps 
WHERE service_deliveries.service_id = ps.id;

-- Drop old columns and rename new ones
-- persona_services
ALTER TABLE persona_services DROP COLUMN id;
ALTER TABLE persona_services RENAME COLUMN new_id TO id;
ALTER TABLE persona_services ADD PRIMARY KEY (id);

-- service_purchases
ALTER TABLE service_purchases DROP COLUMN service_id;
ALTER TABLE service_purchases RENAME COLUMN new_service_id TO service_id;
ALTER TABLE service_purchases ALTER COLUMN service_id SET NOT NULL;

-- Update purchase.id from TEXT to UUID as well for consistency
ALTER TABLE service_purchases ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
UPDATE service_purchases SET new_id = gen_random_uuid() WHERE new_id IS NULL;
ALTER TABLE service_purchases ALTER COLUMN new_id SET NOT NULL;

-- Update user_persona_access.purchase_id to match
ALTER TABLE user_persona_access ADD COLUMN new_purchase_id UUID;
UPDATE user_persona_access 
SET new_purchase_id = sp.new_id 
FROM service_purchases sp 
WHERE user_persona_access.purchase_id = sp.id;

-- Update service_deliveries.purchase_id to match
ALTER TABLE service_deliveries ADD COLUMN new_purchase_id UUID;
UPDATE service_deliveries 
SET new_purchase_id = sp.new_id 
FROM service_purchases sp 
WHERE service_deliveries.purchase_id = sp.id;

-- Drop old purchase IDs and rename new ones
ALTER TABLE service_purchases DROP COLUMN id;
ALTER TABLE service_purchases RENAME COLUMN new_id TO id;
ALTER TABLE service_purchases ADD PRIMARY KEY (id);

-- user_persona_access
ALTER TABLE user_persona_access DROP COLUMN purchase_id;
ALTER TABLE user_persona_access RENAME COLUMN new_purchase_id TO purchase_id;
ALTER TABLE user_persona_access ALTER COLUMN purchase_id SET NOT NULL;

-- service_deliveries
ALTER TABLE service_deliveries DROP COLUMN purchase_id;
ALTER TABLE service_deliveries RENAME COLUMN new_purchase_id TO purchase_id;
ALTER TABLE service_deliveries ALTER COLUMN purchase_id SET NOT NULL;

-- user_persona_access
ALTER TABLE user_persona_access DROP COLUMN service_id;
ALTER TABLE user_persona_access RENAME COLUMN new_service_id TO service_id;
ALTER TABLE user_persona_access ALTER COLUMN service_id SET NOT NULL;

-- service_deliveries
ALTER TABLE service_deliveries DROP COLUMN service_id;
ALTER TABLE service_deliveries RENAME COLUMN new_service_id TO service_id;
ALTER TABLE service_deliveries ALTER COLUMN service_id SET NOT NULL;

-- Re-add foreign key constraints
ALTER TABLE service_purchases 
ADD CONSTRAINT service_purchases_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES persona_services(id);

ALTER TABLE user_persona_access 
ADD CONSTRAINT user_persona_access_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES persona_services(id);

ALTER TABLE user_persona_access 
ADD CONSTRAINT user_persona_access_purchase_id_fkey 
FOREIGN KEY (purchase_id) REFERENCES service_purchases(id);

ALTER TABLE service_deliveries 
ADD CONSTRAINT service_deliveries_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES persona_services(id);

ALTER TABLE service_deliveries 
ADD CONSTRAINT service_deliveries_purchase_id_fkey 
FOREIGN KEY (purchase_id) REFERENCES service_purchases(id);

-- Recreate indexes
DROP INDEX IF EXISTS idx_persona_services_persona_id;
DROP INDEX IF EXISTS idx_persona_services_active;
DROP INDEX IF EXISTS idx_persona_services_type;
DROP INDEX IF EXISTS idx_service_purchases_service_id;
DROP INDEX IF EXISTS idx_service_purchases_buyer;
DROP INDEX IF EXISTS idx_service_purchases_seller;
DROP INDEX IF EXISTS idx_service_purchases_transaction;

CREATE INDEX idx_persona_services_persona_id ON persona_services(persona_id);
CREATE INDEX idx_persona_services_active ON persona_services(is_active);
CREATE INDEX idx_persona_services_type ON persona_services(service_type);
CREATE INDEX idx_service_purchases_service_id ON service_purchases(service_id);
CREATE INDEX idx_service_purchases_buyer ON service_purchases(buyer_wallet);
CREATE INDEX idx_service_purchases_seller ON service_purchases(seller_wallet);
CREATE INDEX idx_service_purchases_transaction ON service_purchases(transaction_id);
