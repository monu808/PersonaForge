-- Add wallet_address column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add comment for clarity
COMMENT ON COLUMN users.wallet_address IS 'User wallet address for crypto transactions and NFT operations';

-- Create index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
