-- =====================================================
-- Migration 021: Create Scrape Sessions Table
-- Purpose: Track individual scraping sessions and their progress
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Create scrape_sessions table
CREATE TABLE IF NOT EXISTS scrape_sessions (
    id VARCHAR(50) PRIMARY KEY,                 -- UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,

    -- Configuration used
    scraper_type VARCHAR(50) NOT NULL,
    agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL,
    config_snapshot JSONB,                      -- Snapshot of config at scrape time

    -- Progress tracking
    status VARCHAR(20) DEFAULT 'pending',       -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    progress INTEGER DEFAULT 0,                 -- 0-100 percentage
    products_found INTEGER DEFAULT 0,
    products_new INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Logs & errors
    logs JSONB DEFAULT '[]'::jsonb,             -- Array of log entries
    error_message TEXT,

    -- Agent observations (for agentic scraping)
    agent_observations JSONB,                   -- Selectors discovered, decisions made

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_user_id ON scrape_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_marketplace_id ON scrape_sessions(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_status ON scrape_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_created_at ON scrape_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_agent_id ON scrape_sessions(agent_id);

-- Partial index for active sessions
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_active ON scrape_sessions(status)
WHERE status IN ('pending', 'running');

-- Add comments
COMMENT ON TABLE scrape_sessions IS 'Individual scraping session tracking';
COMMENT ON COLUMN scrape_sessions.id IS 'UUID for the scrape session';
COMMENT ON COLUMN scrape_sessions.config_snapshot IS 'Snapshot of scraper config at session start';
COMMENT ON COLUMN scrape_sessions.status IS 'Session status: pending, running, completed, failed, cancelled';
COMMENT ON COLUMN scrape_sessions.progress IS 'Progress percentage 0-100';
COMMENT ON COLUMN scrape_sessions.logs IS 'Array of log entries with timestamps';
COMMENT ON COLUMN scrape_sessions.agent_observations IS 'AI agent observations during agentic scraping';
