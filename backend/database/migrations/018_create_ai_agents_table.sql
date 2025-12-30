-- =====================================================
-- Migration 018: Create AI Agents Table
-- Purpose: Store AI agent configurations for scraping and scoring
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Agent identification
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- LLM configuration
    provider VARCHAR(50) NOT NULL,              -- 'openai', 'anthropic', 'local', 'mistral'
    model VARCHAR(100) NOT NULL,                -- 'gpt-4o', 'claude-3-5-sonnet', 'llama-3.1-70b'
    api_endpoint TEXT,                          -- For local/custom models
    api_key_encrypted TEXT,                     -- Encrypted API key

    -- Agent type & capabilities
    agent_type VARCHAR(50) NOT NULL,            -- 'scraper', 'scorer', 'analyzer', 'content'
    capabilities JSONB DEFAULT '[]'::jsonb,     -- ['vision', 'structured_output', 'web_search']

    -- Configuration
    system_prompt TEXT,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    config JSONB DEFAULT '{}'::jsonb,

    -- Performance tracking
    total_tasks INTEGER DEFAULT 0,
    successful_tasks INTEGER DEFAULT 0,
    average_duration INTEGER,                   -- Average task duration in ms
    total_cost DECIMAL(10, 4) DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'active',        -- 'active', 'inactive', 'error'
    last_used_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_provider ON ai_agents(provider);

-- Add update trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_agents_updated_at') THEN
        CREATE TRIGGER update_ai_agents_updated_at
        BEFORE UPDATE ON ai_agents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE ai_agents IS 'AI agent configurations for scraping, scoring, and content generation';
COMMENT ON COLUMN ai_agents.provider IS 'LLM provider: openai, anthropic, local, mistral';
COMMENT ON COLUMN ai_agents.agent_type IS 'Agent purpose: scraper, scorer, analyzer, content';
COMMENT ON COLUMN ai_agents.capabilities IS 'Agent capabilities: vision, structured_output, web_search';
COMMENT ON COLUMN ai_agents.api_key_encrypted IS 'Encrypted API key for the LLM provider';
