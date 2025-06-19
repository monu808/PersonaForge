-- Create podcasts table for storing generated podcasts
CREATE TABLE IF NOT EXISTS podcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  script text NOT NULL,
  topic text,
  duration_minutes integer DEFAULT 0,
  host1_voice_id text NOT NULL,
  host2_voice_id text NOT NULL,
  host1_voice_name text,
  host2_voice_name text,
  audio_url text,
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on podcasts
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Create policies for podcasts
CREATE POLICY "Users can manage their own podcasts"
  ON podcasts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_podcasts_updated_at
  BEFORE UPDATE ON podcasts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);
