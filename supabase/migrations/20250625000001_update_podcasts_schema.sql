-- Update podcasts table to match the expected schema
-- This migration adds the missing columns and updates constraints

-- First check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS public.podcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    script TEXT,
    topic TEXT,
    duration_minutes INTEGER,
    host1_voice_id TEXT,
    host2_voice_id TEXT,
    host1_voice_name TEXT,
    host2_voice_name TEXT,  
    audio_url TEXT,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE public.podcasts 
ADD COLUMN IF NOT EXISTS script TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS host1_voice_id TEXT,
ADD COLUMN IF NOT EXISTS host2_voice_id TEXT,
ADD COLUMN IF NOT EXISTS host1_voice_name TEXT,
ADD COLUMN IF NOT EXISTS host2_voice_name TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Drop existing status constraint if it exists
ALTER TABLE public.podcasts DROP CONSTRAINT IF EXISTS podcasts_status_check;

-- Add updated status constraint
ALTER TABLE public.podcasts ADD CONSTRAINT podcasts_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON public.podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON public.podcasts(status);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON public.podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_topic ON public.podcasts(topic);

-- Enable Row Level Security
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.podcasts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.podcasts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.podcasts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.podcasts;

-- Allow everyone to read podcasts
CREATE POLICY "Enable read access for all users" ON public.podcasts
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert podcasts
CREATE POLICY "Enable insert for authenticated users only" ON public.podcasts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own podcasts
CREATE POLICY "Enable update for users based on user_id" ON public.podcasts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own podcasts
CREATE POLICY "Enable delete for users based on user_id" ON public.podcasts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.podcasts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.podcasts TO authenticated;
