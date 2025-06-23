-- Create live_events table for storing live conversation events
CREATE TABLE live_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  host_replica_id TEXT,
  host_user_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'live', 'ended')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 10,
  type TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_live_events_status ON live_events(status);
CREATE INDEX idx_live_events_visibility ON live_events(visibility);
CREATE INDEX idx_live_events_host_user_id ON live_events(host_user_id);
CREATE INDEX idx_live_events_created_at ON live_events(created_at);

-- Enable RLS
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;

-- Public events can be viewed by everyone
CREATE POLICY "Public events are viewable by everyone" ON live_events
  FOR SELECT USING (visibility = 'public');

-- Users can view their own events regardless of visibility
CREATE POLICY "Users can view own events" ON live_events
  FOR SELECT USING (auth.uid()::text = host_user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events" ON live_events
  FOR INSERT WITH CHECK (auth.uid()::text = host_user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events" ON live_events
  FOR UPDATE USING (auth.uid()::text = host_user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events" ON live_events
  FOR DELETE USING (auth.uid()::text = host_user_id);
