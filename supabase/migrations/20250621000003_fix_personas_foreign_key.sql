-- Fix foreign key constraints to reference auth.users instead of users table
-- This resolves foreign key constraint violations when creating personas and user settings

-- Fix personas table
-- First, drop the existing foreign key constraint
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_user_id_fkey;

-- Add new foreign key constraint referencing auth.users
ALTER TABLE personas 
ADD CONSTRAINT personas_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix user_settings table if it exists
-- First, drop the existing foreign key constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;

-- Add new foreign key constraint referencing auth.users
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the RLS policies to ensure they still work correctly
-- (The existing policies should still work, but let's make sure they're consistent)

-- Personas policies
DROP POLICY IF EXISTS "Users can CRUD own personas" ON personas;
CREATE POLICY "Users can CRUD own personas"
  ON personas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- User settings policies  
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Clean up any orphaned records
-- Remove personas with invalid user_ids
DELETE FROM personas 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove user_settings with invalid user_ids
DELETE FROM user_settings 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Add comments for clarity
COMMENT ON CONSTRAINT personas_user_id_fkey ON personas IS 
'Foreign key constraint linking personas to auth.users table';

COMMENT ON CONSTRAINT user_settings_user_id_fkey ON user_settings IS 
'Foreign key constraint linking user_settings to auth.users table';
