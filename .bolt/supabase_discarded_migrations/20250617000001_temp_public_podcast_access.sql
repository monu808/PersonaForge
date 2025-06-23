-- Temporary migration to allow public access to podcasts for testing
-- This should be removed in production and proper authentication should be used

-- Add a temporary policy for public insert access (for testing)
CREATE POLICY "Allow public podcast creation for testing"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add a temporary policy for public select access (for testing)
CREATE POLICY "Allow public podcast reading for testing"
  ON podcasts
  FOR SELECT
  TO anon
  USING (true);

-- Add a temporary policy for public update access (for testing)
CREATE POLICY "Allow public podcast updates for testing"
  ON podcasts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
