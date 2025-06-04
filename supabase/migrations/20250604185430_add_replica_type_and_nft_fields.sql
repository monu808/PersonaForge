-- Add replica_type column with CHECK constraint
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS replica_type TEXT CHECK (replica_type IN ('personal', 'historical', 'professional', 'emergency', 'creator'));

-- Add Algorand NFT related columns
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS nft_asset_id BIGINT, -- Algorand Asset IDs are uint64
ADD COLUMN IF NOT EXISTS creator_wallet_address TEXT;

-- Add comments for clarity
COMMENT ON COLUMN personas.replica_type IS 'Type of the AI replica (e.g., personal, historical).';
COMMENT ON COLUMN personas.nft_asset_id IS 'Algorand Asset ID for the NFT representing this replica.';
COMMENT ON COLUMN personas.creator_wallet_address IS 'Algorand wallet address of the replica creator for royalty distribution.';

