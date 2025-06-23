-- Fix service_type constraint to match current application service types
-- Migration: 20250619000007_fix_service_type_constraint_final.sql

-- Drop the old constraint
ALTER TABLE persona_services DROP CONSTRAINT IF EXISTS persona_services_service_type_check;

-- Add the correct constraint with current application service types
ALTER TABLE persona_services ADD CONSTRAINT persona_services_service_type_check 
CHECK (service_type IN ('consultation', 'content_creation', 'voice_message', 'video_call', 'custom'));

-- Update any existing records that might have invalid service types
UPDATE persona_services 
SET service_type = CASE 
    WHEN service_type = 'video' THEN 'content_creation'
    WHEN service_type = 'image' THEN 'content_creation'
    WHEN service_type = 'text' THEN 'content_creation'
    ELSE service_type
END
WHERE service_type NOT IN ('consultation', 'content_creation', 'voice_message', 'video_call', 'custom');

-- Update RLS policies if needed (they should already exist)
-- No additional policies needed as they are already set up
