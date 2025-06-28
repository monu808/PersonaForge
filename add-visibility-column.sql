-- Add visibility column to podcasts table
-- This script adds a visibility column to support public, private, and unlisted podcasts

-- Add the visibility column with default value of 'public'
ALTER TABLE podcasts 
ADD COLUMN visibility TEXT DEFAULT 'public';

-- Add a check constraint to ensure only valid visibility values
ALTER TABLE podcasts 
ADD CONSTRAINT visibility_check 
CHECK (visibility IN ('public', 'private', 'unlisted'));

-- Update any existing NULL values to 'public' (just in case)
UPDATE podcasts 
SET visibility = 'public' 
WHERE visibility IS NULL;

-- Create an index on visibility for better query performance
CREATE INDEX IF NOT EXISTS idx_podcasts_visibility ON podcasts(visibility);

-- Create a composite index for common queries (status + visibility)
CREATE INDEX IF NOT EXISTS idx_podcasts_status_visibility ON podcasts(status, visibility);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'podcasts' 
AND column_name = 'visibility';
