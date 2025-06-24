-- Fix Row Level Security policies for podcasts table
-- This migration ensures that podcasts can be read by authenticated and anonymous users

-- First, check if RLS is enabled and disable it temporarily to fix permissions
ALTER TABLE IF EXISTS public.podcasts DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE IF EXISTS public.podcasts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.podcasts;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.podcasts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.podcasts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.podcasts;

-- Create new policies that allow:
-- 1. Anyone to read podcasts (for public access)
-- 2. Authenticated users to insert podcasts
-- 3. Users to update/delete their own podcasts

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

-- Grant necessary permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.podcasts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.podcasts TO authenticated;
