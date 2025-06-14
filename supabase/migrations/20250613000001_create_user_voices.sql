-- Create user_voices table for ElevenLabs voice management
CREATE TABLE IF NOT EXISTS user_voices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_id text NOT NULL,
  name text NOT NULL,
  description text,
  platform text NOT NULL DEFAULT 'elevenlabs',
  is_cloned boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, voice_id)
);

-- Enable RLS on user_voices
ALTER TABLE user_voices ENABLE ROW LEVEL SECURITY;

-- Create policies for user_voices
CREATE POLICY "Users can manage their own voices"
  ON user_voices
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create trigger to update updated_at
CREATE TRIGGER update_user_voices_updated_at
  BEFORE UPDATE ON user_voices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON user_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_voices_voice_id ON user_voices(voice_id);
CREATE INDEX IF NOT EXISTS idx_user_voices_platform ON user_voices(platform);
