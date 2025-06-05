/*
  # Add Storage Bucket for Persona Content

  1. Changes
    - Create 'persona-content' bucket for storing audio files
    - Add policy for authenticated users to upload files
    - Add policy for public read access to files
*/

-- Create the bucket for persona content
INSERT INTO storage.buckets (id, name, public)
VALUES ('persona-content', 'persona-content', true)
ON CONFLICT DO NOTHING;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload persona content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'persona-content' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to persona content
CREATE POLICY "Allow public read access to persona content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'persona-content');
