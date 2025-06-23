-- STEP 1: First run this to find the user ID
SELECT id, email, created_at FROM auth.users WHERE email = 'Monu80850raj@gmail.com';

-- STEP 2: Copy the ID from above and replace ACTUAL_USER_ID_HERE in the queries below

-- Grant enterprise access (replace ACTUAL_USER_ID_HERE with the real UUID)
INSERT INTO user_subscriptions (
  user_id,
  status,
  plan_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'ACTUAL_USER_ID_HERE', -- Paste the real UUID here (something like '550e8400-e29b-41d4-a716-446655440000')
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

-- Initialize usage tracking (replace ACTUAL_USER_ID_HERE with the same UUID)
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
  'ACTUAL_USER_ID_HERE', -- Paste the same UUID here
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

-- Verify the subscription was created
SELECT 
  us.*,
  au.email
FROM user_subscriptions us
JOIN auth.users au ON us.user_id = au.id
WHERE au.email = 'Monu80850raj@gmail.com';
