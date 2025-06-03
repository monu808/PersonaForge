/*
  # Add Tavus integration fields
  
  1. Changes
     - Add tavus_replica_id to user_settings table
     - Add tavus_video fields to persona_content table metadata
  
  2. Security
     - Maintain existing RLS policies
*/

-- Add tavus_replica_id to user_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'tavus_replica_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN tavus_replica_id TEXT;
  END IF;
END $$;

-- No need to modify the persona_content table structure since we can use the existing metadata JSONB field
-- Just make sure we document the expected structure:
COMMENT ON COLUMN persona_content.metadata IS 'For Tavus videos, includes: tavus_video_id, status, video_url, thumbnail_url, duration, script, error (if failed)';

-- Create index on the tavus_replica_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_settings' AND indexname = 'idx_user_settings_tavus_replica_id'
  ) THEN
    CREATE INDEX idx_user_settings_tavus_replica_id ON user_settings (tavus_replica_id);
  END IF;
END $$;

-- Create index on the persona_content.content field for Tavus video IDs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'persona_content' AND indexname = 'idx_persona_content_tavus_video'
  ) THEN
    CREATE INDEX idx_persona_content_tavus_video ON persona_content (content) 
    WHERE content_type = 'video';
  END IF;
END $$;