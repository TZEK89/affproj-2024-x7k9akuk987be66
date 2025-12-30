-- =====================================================
-- Migration 020: Create Marketplaces Table
-- Purpose: Store marketplace configurations for scraping affiliate products
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Create marketplaces table
CREATE TABLE IF NOT EXISTS marketplaces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Platform identification
    platform VARCHAR(100) NOT NULL,             -- 'hotmart', 'clickbank', 'jvzoo', 'custom'
    name VARCHAR(255) NOT NULL,                 -- User-friendly name
    icon_url TEXT,                              -- Custom icon or default

    -- URL configuration
    base_url TEXT NOT NULL,
    language VARCHAR(10),                       -- 'en', 'pt-br', 'es', etc.
    category_filter VARCHAR(255),               -- Pre-scrape category filter

    -- Scraping configuration
    scraper_type VARCHAR(50) DEFAULT 'playwright', -- 'playwright', 'brightdata', 'firecrawl', 'agentic'
    scraper_config JSONB DEFAULT '{}'::jsonb,
    agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL,

    -- Scrape settings
    max_products INTEGER DEFAULT 100,
    scrape_frequency VARCHAR(20) DEFAULT 'manual', -- 'manual', 'daily', 'weekly'
    auto_scrape_enabled BOOLEAN DEFAULT false,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'ready',         -- 'ready', 'scraping', 'error', 'paused'
    last_scraped_at TIMESTAMP,
    last_scrape_duration INTEGER,               -- Duration in seconds
    products_count INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplaces_user_id ON marketplaces(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_platform ON marketplaces(platform);
CREATE INDEX IF NOT EXISTS idx_marketplaces_status ON marketplaces(status);
CREATE INDEX IF NOT EXISTS idx_marketplaces_agent_id ON marketplaces(agent_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_auto_scrape ON marketplaces(auto_scrape_enabled) WHERE auto_scrape_enabled = true;

-- Add update trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marketplaces_updated_at') THEN
        CREATE TRIGGER update_marketplaces_updated_at
        BEFORE UPDATE ON marketplaces
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE marketplaces IS 'Marketplace configurations for scraping affiliate products';
COMMENT ON COLUMN marketplaces.platform IS 'Marketplace platform: hotmart, clickbank, jvzoo, custom';
COMMENT ON COLUMN marketplaces.scraper_type IS 'Scraping method: playwright, brightdata, firecrawl, agentic';
COMMENT ON COLUMN marketplaces.scraper_config IS 'Custom scraper configuration (selectors, wait times, etc.)';
COMMENT ON COLUMN marketplaces.scrape_frequency IS 'How often to scrape: manual, daily, weekly';
COMMENT ON COLUMN marketplaces.status IS 'Current status: ready, scraping, error, paused';
