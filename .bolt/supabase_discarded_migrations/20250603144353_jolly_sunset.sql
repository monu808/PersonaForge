/*
  # Create avatars storage bucket
  
  1. Changes
    - Create a new storage bucket for avatars
    - Configure public access and security settings
  
  2. Security
    - Enable public read access
    - Restrict write operations to authenticated users
*/

-- Create the avatars bucket using the storage API
SELECT storage.create_bucket('avatars', {'public': true});

-- Create policy to allow authenticated users to upload avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to update their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Create policy to allow users to delete their own avatars
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() = owner
);

-- Create policy to allow public read access to avatars
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');