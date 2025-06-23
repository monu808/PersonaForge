-- Direct SQL to grant enterprise access
-- Run this in Supabase SQL Editor (requires admin access)

-- Step 1: Update or insert subscription
INSERT INTO user_subscriptions (
  user_id,
  status,
  plan_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'adb771b6-b568-4b4c-a03f-8236b8950933',
  'active',
  'enterprise',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW()
) ON CONFLICT (user_id) 
DO UPDATE SET 
  status = 'active',
  plan_id = 'enterprise',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- Step 2: Update or insert usage tracking
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
  'adb771b6-b568-4b4c-a03f-8236b8950933',
  0,
  0,
  0,
  0,
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
) ON CONFLICT (user_id)
DO UPDATE SET
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW();

-- Step 3: Verify the changes
SELECT 
  us.user_id,
  us.status,
  us.plan_id,
  us.current_period_end,
  au.email
FROM user_subscriptions us
JOIN auth.users au ON us.user_id = au.id
WHERE us.user_id = 'adb771b6-b568-4b4c-a03f-8236b8950933';
