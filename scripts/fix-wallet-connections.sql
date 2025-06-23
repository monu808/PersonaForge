-- Script to fix wallet connection issues
-- Run this in your Supabase SQL editor

-- First, let's see the current state of wallet connections
SELECT 
    'Current Wallet Connections' as section,
    email,
    wallet_address,
    raw_user_meta_data->>'wallet_address' as metadata_wallet,
    id
FROM auth.users 
WHERE email IN (
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
)
ORDER BY email;

-- Check if there are duplicate wallet addresses
SELECT 
    'Duplicate Wallet Check' as section,
    wallet_address,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ') as emails
FROM auth.users 
WHERE wallet_address IS NOT NULL
GROUP BY wallet_address
HAVING COUNT(*) > 1;

-- Find the specific wallet address causing issues
-- Replace 'YOUR_WALLET_ADDRESS' with the actual wallet address
SELECT 
    'Wallet Owners' as section,
    email,
    id,
    wallet_address,
    created_at
FROM auth.users 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- SOLUTION 1: Remove wallet from unwanted accounts
-- Uncomment and run this to remove wallet from narendrasinghchouhan2022@vitbhopal.ac.in
/*
UPDATE auth.users 
SET wallet_address = NULL 
WHERE email = 'narendrasinghchouhan2022@vitbhopal.ac.in';
*/

-- SOLUTION 2: Set wallet to specific user only
-- Uncomment and run this to assign wallet only to monu80850raj@gmail.com
/*
-- First remove from all users
UPDATE auth.users 
SET wallet_address = NULL 
WHERE wallet_address = 'YOUR_WALLET_ADDRESS';

-- Then add to specific user
UPDATE auth.users 
SET wallet_address = 'YOUR_WALLET_ADDRESS' 
WHERE email = 'monu80850raj@gmail.com';
*/

-- SOLUTION 3: Add wallet to rmonu3605@gmail.com if needed
-- Uncomment and run this to add wallet to rmonu3605@gmail.com
/*
UPDATE auth.users 
SET wallet_address = 'YOUR_WALLET_ADDRESS' 
WHERE email = 'rmonu3605@gmail.com';
*/

-- Verify the changes
SELECT 
    'After Fix - Wallet Connections' as section,
    email,
    wallet_address,
    raw_user_meta_data->>'wallet_address' as metadata_wallet,
    id
FROM auth.users 
WHERE email IN (
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
)
ORDER BY email;
