/*
  # Create User Trigger

  1. New Functions
    - Creates a function to automatically create user records when new auth users are created
    - Handles initial user data population
    - Sets up default user settings

  2. Security
    - Function executes with security definer permissions
    - Maintains RLS policies
    
  3. Changes
    - Adds trigger on auth.users table
    - Creates corresponding records in public.users and user_settings
*/

-- Create the function that will handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create the user record
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NEW.created_at,
    NEW.created_at
  );

  -- Create default user settings
  INSERT INTO public.user_settings (user_id, profile_visibility, email_notifications, theme)
  VALUES (
    NEW.id,
    'private',
    true,
    'system'
  );

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();