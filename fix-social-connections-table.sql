-- Fix social_connections table by adding missing columns
ALTER TABLE social_connections 
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expiry TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Update existing records if any
UPDATE social_connections 
SET access_token = COALESCE(access_token, ''),
    account_id = COALESCE(account_id, ''),
    settings = COALESCE(settings, '{}')
WHERE access_token IS NULL OR account_id IS NULL OR settings IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform);