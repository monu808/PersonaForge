-- Script to investigate wallet connection issues
-- This will help us understand how wallet addresses are stored and linked to users

-- 1. Check users table structure and wallet addresses
SELECT 
    id,
    email,
    wallet_address,
    raw_user_meta_data->>'wallet_address' as metadata_wallet,
    created_at
FROM auth.users 
WHERE email IN (
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
)
ORDER BY email;

-- 2. Check public.users table if it exists
SELECT 
    id,
    email,
    wallet_address,
    created_at
FROM public.users 
WHERE email IN (
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
)
ORDER BY email;

-- 3. Check for any wallet-related data in service_purchases
SELECT 
    buyer_id,
    buyer_wallet,
    created_at,
    (SELECT email FROM auth.users WHERE id = buyer_id) as buyer_email
FROM service_purchases 
WHERE buyer_wallet IS NOT NULL
ORDER BY created_at DESC;

-- 4. Check for duplicate wallet addresses
SELECT 
    wallet_address,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ') as emails
FROM auth.users 
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- 5. Check raw_user_meta_data for wallet info
SELECT 
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'wallet_address' as wallet_from_metadata
FROM auth.users 
WHERE raw_user_meta_data IS NOT NULL 
    AND raw_user_meta_data::text ILIKE '%wallet%'
ORDER BY email;
