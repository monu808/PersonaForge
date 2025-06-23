-- Create user_usage table to track plan limits
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Usage counters (reset monthly)
  personas_created integer DEFAULT 0,
  text_to_speech_used integer DEFAULT 0,
  voice_clones_created integer DEFAULT 0,
  live_conversation_minutes_used integer DEFAULT 0,
  
  -- Monthly reset tracking
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS on user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user_usage
CREATE POLICY "Users can view their own usage"
  ON user_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own usage"
  ON user_usage
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage"
  ON user_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all usage"
  ON user_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_period ON user_usage(current_period_start, current_period_end);

-- Function to reset usage counters monthly
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_usage 
  SET 
    personas_created = 0,
    text_to_speech_used = 0,
    voice_clones_created = 0,
    live_conversation_minutes_used = 0,
    current_period_start = now(),
    current_period_end = now() + interval '1 month',
    updated_at = now()
  WHERE current_period_end < now();
END;
$$;

-- Create a scheduled job to reset usage monthly (requires pg_cron extension)
-- SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', 'SELECT reset_monthly_usage();');
