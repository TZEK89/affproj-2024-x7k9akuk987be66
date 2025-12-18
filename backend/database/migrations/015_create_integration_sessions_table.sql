-- Create integration_sessions table for persistent session storage
-- This table stores encrypted browser session data for authenticated scraping

CREATE TABLE IF NOT EXISTS integration_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    storage_state_json_encrypted TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata for debugging
    last_error TEXT,
    last_screenshot_url TEXT,
    last_url TEXT,
    
    -- Ensure one active session per user per platform
    UNIQUE(user_id, platform)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_sessions_user_platform 
ON integration_sessions(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_integration_sessions_status 
ON integration_sessions(status);

CREATE INDEX IF NOT EXISTS idx_integration_sessions_expires_at 
ON integration_sessions(expires_at);

-- Add comments
COMMENT ON TABLE integration_sessions IS 'Stores encrypted browser session data for persistent authentication across scraping runs';
COMMENT ON COLUMN integration_sessions.storage_state_json_encrypted IS 'Encrypted Playwright storageState JSON (cookies, localStorage, sessionStorage)';
COMMENT ON COLUMN integration_sessions.status IS 'Session status: active, expired, needs_reconnect, error';
COMMENT ON COLUMN integration_sessions.expires_at IS 'When this session is expected to expire (platform-dependent)';
