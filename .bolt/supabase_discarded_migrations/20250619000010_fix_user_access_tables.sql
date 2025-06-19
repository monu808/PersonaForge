-- Fix user access tables and policies
-- This migration ensures all required tables exist with correct schemas and RLS policies

-- Drop existing tables if they have issues (CASCADE to handle dependencies)
DROP TABLE IF EXISTS service_deliveries CASCADE;
DROP TABLE IF EXISTS user_persona_access CASCADE;

-- Recreate user_persona_access table with correct schema
CREATE TABLE user_persona_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES persona_services(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES service_purchases(id) ON DELETE SET NULL,
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    access_type TEXT DEFAULT 'purchase' CHECK (access_type IN ('purchase', 'subscription', 'trial', 'gift')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique access per user/service combination
    UNIQUE(user_id, service_id)
);

-- Recreate service_deliveries table
CREATE TABLE service_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_access_id UUID NOT NULL REFERENCES user_persona_access(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES persona_services(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'cancelled')),
    delivery_method TEXT DEFAULT 'automatic' CHECK (delivery_method IN ('automatic', 'manual', 'email', 'download')),
    content_url TEXT,
    content_text TEXT,
    file_type TEXT,
    file_size BIGINT,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT NULL,
    delivered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_persona_access_user_id ON user_persona_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_persona_access_persona_id ON user_persona_access(persona_id);
CREATE INDEX IF NOT EXISTS idx_user_persona_access_service_id ON user_persona_access(service_id);
CREATE INDEX IF NOT EXISTS idx_user_persona_access_active ON user_persona_access(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_deliveries_user_id ON service_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_service_id ON service_deliveries(service_id);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_status ON service_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_service_deliveries_user_access ON service_deliveries(user_access_id);

-- Enable RLS
ALTER TABLE user_persona_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own access" ON user_persona_access;
DROP POLICY IF EXISTS "Users can insert their own access" ON user_persona_access;
DROP POLICY IF EXISTS "System can insert access grants" ON user_persona_access;
DROP POLICY IF EXISTS "Users can view their own deliveries" ON service_deliveries;
DROP POLICY IF EXISTS "Users can insert delivery records" ON service_deliveries;
DROP POLICY IF EXISTS "System can manage deliveries" ON service_deliveries;

-- Create comprehensive RLS policies for user_persona_access
CREATE POLICY "Users can view their own access" ON user_persona_access
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access" ON user_persona_access
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own access" ON user_persona_access
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow system/service to grant access (for purchase flows)
CREATE POLICY "System can grant access" ON user_persona_access
    FOR ALL USING (true);

-- Create RLS policies for service_deliveries
CREATE POLICY "Users can view their own deliveries" ON service_deliveries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert delivery records" ON service_deliveries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage deliveries" ON service_deliveries
    FOR ALL USING (true);

-- Create or replace function to automatically grant access after purchase
CREATE OR REPLACE FUNCTION grant_service_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert access record when a purchase is made
    INSERT INTO user_persona_access (
        user_id,
        persona_id,
        service_id,
        purchase_id,
        access_granted_at,
        is_active
    )
    SELECT 
        NEW.buyer_user_id,
        ps.persona_id,
        NEW.service_id,
        NEW.id,
        NOW(),
        true
    FROM persona_services ps 
    WHERE ps.id = NEW.service_id
    ON CONFLICT (user_id, service_id) 
    DO UPDATE SET 
        is_active = true,
        access_granted_at = NOW(),
        purchase_id = NEW.id,
        updated_at = NOW();
    
    -- Create delivery record if service has content
    INSERT INTO service_deliveries (
        user_access_id,
        service_id,
        user_id,
        delivery_status,
        delivery_method,
        content_url,
        content_text,
        file_type
    )
    SELECT 
        upa.id,
        ps.id,
        NEW.buyer_user_id,
        CASE 
            WHEN ps.auto_delivery = true THEN 'delivered'
            ELSE 'pending'
        END,
        'automatic',
        ps.delivery_url,
        ps.delivery_content,
        ps.file_type
    FROM user_persona_access upa
    JOIN persona_services ps ON ps.id = upa.service_id
    WHERE upa.user_id = NEW.buyer_user_id 
    AND upa.service_id = NEW.service_id
    AND (ps.delivery_url IS NOT NULL OR ps.delivery_content IS NOT NULL)
    AND NOT EXISTS (
        SELECT 1 FROM service_deliveries sd 
        WHERE sd.user_id = NEW.buyer_user_id 
        AND sd.service_id = NEW.service_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically grant access on purchase
DROP TRIGGER IF EXISTS auto_grant_access_trigger ON service_purchases;
CREATE TRIGGER auto_grant_access_trigger
    AFTER INSERT ON service_purchases
    FOR EACH ROW
    EXECUTE FUNCTION grant_service_access();

-- Add buyer_user_id to service_purchases if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_purchases' 
        AND column_name = 'buyer_user_id'
    ) THEN
        ALTER TABLE service_purchases 
        ADD COLUMN buyer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_service_purchases_buyer_user_id 
        ON service_purchases(buyer_user_id);
    END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_persona_access_updated_at ON user_persona_access;
CREATE TRIGGER update_user_persona_access_updated_at
    BEFORE UPDATE ON user_persona_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_deliveries_updated_at ON service_deliveries;
CREATE TRIGGER update_service_deliveries_updated_at
    BEFORE UPDATE ON service_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_persona_access TO authenticated;
GRANT ALL ON service_deliveries TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
