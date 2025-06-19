-- Fix service_type constraint to match current application
-- Migration: 20250619000006_fix_service_type_constraint.sql

-- Drop the old constraint
ALTER TABLE persona_services DROP CONSTRAINT IF EXISTS persona_services_service_type_check;

-- Add the correct constraint with updated service types
ALTER TABLE persona_services ADD CONSTRAINT persona_services_service_type_check 
CHECK (service_type IN ('consultation', 'video', 'image', 'text', 'voice_message', 'custom'));

-- Update any existing records that might have invalid service types
UPDATE persona_services 
SET service_type = CASE 
    WHEN service_type = 'content_creation' THEN 'video'
    WHEN service_type = 'video_call' THEN 'consultation'
    ELSE service_type
END
WHERE service_type NOT IN ('consultation', 'video', 'image', 'text', 'voice_message', 'custom');
