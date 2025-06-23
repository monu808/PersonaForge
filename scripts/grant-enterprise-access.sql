-- Script to grant enterprise access to a specific user
-- Email: Monu80850raj@gmail.com

-- First, let's find the user ID based on email
-- You'll need to replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- Step 1: Find user ID (run this first to get the user ID)
SELECT id, email FROM auth.users WHERE email = 'Monu80850raj@gmail.com';

-- Step 2: Insert or update user subscription (replace USER_ID_HERE with actual ID from step 1)
INSERT INTO user_subscriptions (
  user_id,
  status,
  plan_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'USER_ID_HERE', -- Replace with actual user ID
  'active',
  'enterprise',
  NOW(),
  NOW() + INTERVAL '1 year', -- Give 1 year of enterprise access
  NOW(),
  NOW()
) ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  plan_id = 'enterprise',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- Step 3: Initialize or reset usage for the user
INSERT INTO user_usage (
  user_id,
  personas_created,
  text_to_speech_used,
  voice_clones_created,
  live_conversation_minutes_used,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'USER_ID_HERE', -- Replace with actual user ID
  0,
  0,
  0,
  0,
  NOW(),
  NOW() + INTERVAL '1 month', -- Reset monthly
  NOW(),
  NOW()
) ON CONFLICT (user_id)
DO UPDATE SET
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW();
