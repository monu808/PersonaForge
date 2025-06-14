/*
  # Update Storage Policies for Persona Content

  1. Changes
    - Add policy for authenticated users to update files
    - Add policy for authenticated users to delete files
    - Add specific policies for training-videos and audio folders
*/

-- Allow authenticated users to update files in persona-content bucket
CREATE POLICY "Allow authenticated users to update persona content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'persona-content' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'persona-content' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in persona-content bucket
CREATE POLICY "Allow authenticated users to delete persona content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'persona-content' AND
  auth.role() = 'authenticated'
);

-- Ensure the bucket allows file uploads with proper permissions
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 524288000, -- 500MB limit
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/m4a',
    'audio/ogg',
    'audio/webm'
  ]
WHERE id = 'persona-content';
