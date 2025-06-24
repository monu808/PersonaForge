-- Create podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    persona_id UUID,
    audio_url TEXT,
    duration INTEGER, -- Duration in seconds
    file_size BIGINT, -- File size in bytes
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata fields
    tags TEXT[], -- Array of tags
    category TEXT,
    language TEXT DEFAULT 'en',
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    
    -- Audio processing metadata
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_persona_id ON podcasts(persona_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_visibility ON podcasts(visibility);

-- Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own podcasts
CREATE POLICY "Users can view their own podcasts" ON podcasts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own podcasts
CREATE POLICY "Users can insert their own podcasts" ON podcasts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own podcasts
CREATE POLICY "Users can update their own podcasts" ON podcasts
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own podcasts
CREATE POLICY "Users can delete their own podcasts" ON podcasts
    FOR DELETE USING (auth.uid() = user_id);

-- Public podcasts can be viewed by anyone
CREATE POLICY "Public podcasts can be viewed by anyone" ON podcasts
    FOR SELECT USING (visibility = 'public');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_podcasts_updated_at 
    BEFORE UPDATE ON podcasts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON podcasts TO authenticated;
GRANT SELECT ON podcasts TO anon;
