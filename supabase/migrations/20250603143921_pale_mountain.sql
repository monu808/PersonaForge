/*
  # Add Storage Policies for Avatar Uploads

  1. Security
    - Enable storage policies for the avatars bucket
    - Add policy for authenticated users to upload avatars
    - Add policy for public read access to avatars
*/

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public read access to avatars
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');