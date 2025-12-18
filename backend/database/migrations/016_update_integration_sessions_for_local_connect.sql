-- Update integration_sessions table for Local Connect flow
-- Adds fields for token-based upload and proof tracking

ALTER TABLE integration_sessions
ADD COLUMN IF NOT EXISTS cookie_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS connect_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS connect_token_expires_at TIMESTAMP;

-- Add index for connect_token lookups
CREATE INDEX IF NOT EXISTS idx_integration_sessions_connect_token 
ON integration_sessions(connect_token);

-- Add comments
COMMENT ON COLUMN integration_sessions.cookie_count IS 'Number of cookies in the saved session (proof of authentication)';
COMMENT ON COLUMN integration_sessions.connect_token IS 'Short-lived token for local connector to upload storageState';
COMMENT ON COLUMN integration_sessions.connect_token_expires_at IS 'When the connect token expires (typically 10 minutes)';
