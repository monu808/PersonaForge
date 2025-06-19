-- CHECK TABLE STRUCTURE: Run this to see what columns actually exist
-- Run this in Supabase SQL Editor

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_purchases'
ORDER BY ordinal_position;
