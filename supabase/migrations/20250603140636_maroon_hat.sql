/*
  # Initial Schema Setup for PersonaForge

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text, unique)
      - created_at (timestamp)
      - last_login (timestamp)
      - role (text)
    - personas
      - id (uuid, primary key)
      - user_id (uuid, foreign key)
      - name (text)
      - description (text)
      - attributes (jsonb)
      - created_at (timestamp)
      - updated_at (timestamp)
    - persona_content
      - id (uuid, primary key)
      - persona_id (uuid, foreign key)
      - content_type (text)
      - content (text)
      - metadata (jsonb)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

-- Create personas table
CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  attributes jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create persona_content table
CREATE TABLE IF NOT EXISTS persona_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_content ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create policies for personas table
CREATE POLICY "Users can CRUD own personas"
  ON personas
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for persona_content table
CREATE POLICY "Users can CRUD own persona content"
  ON persona_content
  FOR ALL
  TO authenticated
  USING (
    persona_id IN (
      SELECT id FROM personas WHERE user_id = auth.uid()
    )
  );