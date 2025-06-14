/*
  # Add Tavus Integration Tables

  1. New Tables
    - `persona_content` - Stores videos, audio, and other content for personas
      - `id` (uuid, primary key)
      - `persona_id` (uuid, references personas)
      - `content_type` (text) - Type of content (video, audio, etc.)
      - `content` (text) - Content URL or data
      - `metadata` (jsonb) - Additional metadata like status, URLs, etc.
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on persona_content table
    - Add policies for authenticated users
*/

-- Create persona_content table
CREATE TABLE IF NOT EXISTS persona_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE persona_content ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own content
CREATE POLICY "Users can manage their own persona content"
  ON persona_content
  FOR ALL
  TO authenticated
  USING (
    persona_id IN (
      SELECT id FROM personas WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    persona_id IN (
      SELECT id FROM personas WHERE user_id = auth.uid()
    )
  );

-- Add indexes
CREATE INDEX idx_persona_content_persona_id ON persona_content(persona_id);
CREATE INDEX idx_persona_content_content_type ON persona_content(content_type);
CREATE INDEX idx_persona_content_created_at ON persona_content(created_at);