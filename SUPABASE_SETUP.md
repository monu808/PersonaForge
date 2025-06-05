# Supabase Configuration for PersonaForge

This document outlines the steps needed to properly configure Supabase for the PersonaForge application, specifically for Eleven Labs audio generation and storage.

## Storage Buckets

### 1. Create the persona-content bucket

Run the migration we've created at `supabase/migrations/20250605000000_add_persona_content_bucket.sql` or manually create the bucket:

```sql
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
```

## Database Schema

### Check the persona_content table

The persona_content table should have the following structure:

```sql
CREATE TABLE IF NOT EXISTS persona_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

Note that this table doesn't include a `user_id` column. Instead, the relationship is handled through `persona_id`, which references a persona that is owned by a user.

## Edge Functions

### Environment Variables

Make sure the following environment variables are set in your Supabase project:

- `ELEVENLABS_API_KEY` - Your Eleven Labs API key

### CORS Configuration

Update your CORS configuration in the Supabase dashboard to allow requests from your development and production domains.

## Code Updates

Once you have the Supabase infrastructure properly set up, you can:

1. Uncomment the storage upload code in `src/lib/api/elevenlabs.ts`
2. Uncomment the database insertion code in `src/lib/api/elevenlabs.ts`
3. Replace the mock functions in `getPersonaAudios` with actual database queries

## Testing

After making these changes, test audio uploads with small audio files first, then gradually increase complexity to ensure everything works properly.
