-- Make podcasts visible to all users
-- Remove existing restrictive policies and create new public ones

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own podcasts" ON podcasts;
DROP POLICY IF EXISTS "Allow public podcast creation for testing" ON podcasts;
DROP POLICY IF EXISTS "Allow public podcast reading for testing" ON podcasts;
DROP POLICY IF EXISTS "Allow public podcast updates for testing" ON podcasts;

-- Create new public policies that allow all users to see all podcasts
CREATE POLICY "Allow authenticated users to read all podcasts"
  ON podcasts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to read all podcasts too (for demo purposes)
CREATE POLICY "Allow anonymous users to read all podcasts"
  ON podcasts
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to create podcasts
CREATE POLICY "Allow authenticated users to create podcasts"
  ON podcasts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to create podcasts (for demo purposes)
CREATE POLICY "Allow anonymous users to create podcasts"
  ON podcasts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow users to update any podcast (for demo purposes)
CREATE POLICY "Allow authenticated users to update all podcasts"
  ON podcasts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to update podcasts (for demo purposes)
CREATE POLICY "Allow anonymous users to update all podcasts"
  ON podcasts
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow users to delete any podcast (for demo purposes)
CREATE POLICY "Allow authenticated users to delete all podcasts"
  ON podcasts
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow anonymous users to delete podcasts (for demo purposes)
CREATE POLICY "Allow anonymous users to delete all podcasts"
  ON podcasts
  FOR DELETE
  TO anon
  USING (true);
