-- SQL commands to manually set up public access for podcasts table
-- Run these in your Supabase SQL Editor to temporarily allow public access

-- First, check the current policies
-- SELECT * FROM pg_policies WHERE tablename = 'podcasts';

-- Add temporary policies for public access (for testing only)
DROP POLICY IF EXISTS "Allow public podcast creation for testing" ON podcasts;
DROP POLICY IF EXISTS "Allow public podcast reading for testing" ON podcasts;  
DROP POLICY IF EXISTS "Allow public podcast updates for testing" ON podcasts;

CREATE POLICY "Allow public podcast creation for testing"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public podcast reading for testing"
  ON podcasts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public podcast updates for testing"
  ON podcasts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Alternative: Temporarily disable RLS entirely (use with caution)
-- ALTER TABLE podcasts DISABLE ROW LEVEL SECURITY;

-- To re-enable later:
-- ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
-- DROP POLICY "Allow public podcast creation for testing" ON podcasts;
-- DROP POLICY "Allow public podcast reading for testing" ON podcasts;
-- DROP POLICY "Allow public podcast updates for testing" ON podcasts;
