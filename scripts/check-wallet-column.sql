-- Check if wallet_address column exists in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Alternative query to check specifically for wallet_address
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'wallet_address'
    AND table_schema = 'public'
) AS wallet_address_exists;

-- Show all columns in the users table
\d users;
