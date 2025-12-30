-- =====================================================
-- Migration 019: Create Scraper Configs Table
-- Purpose: Store scraper service configurations (Brightdata, Firecrawl, etc.)
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Create scraper_configs table
CREATE TABLE IF NOT EXISTS scraper_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Scraper identification
    name VARCHAR(255) NOT NULL,
    scraper_type VARCHAR(50) NOT NULL,          -- 'brightdata', 'firecrawl', 'octoparse', 'custom'

    -- Connection details (encrypted)
    api_key_encrypted TEXT,
    api_endpoint TEXT,
    additional_config JSONB DEFAULT '{}'::jsonb, -- Proxy settings, zones, etc.

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMP,
    test_status VARCHAR(20),                    -- 'success', 'failed'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraper_configs_user_id ON scraper_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraper_configs_type ON scraper_configs(scraper_type);
CREATE INDEX IF NOT EXISTS idx_scraper_configs_active ON scraper_configs(is_active);

-- Add update trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_scraper_configs_updated_at') THEN
        CREATE TRIGGER update_scraper_configs_updated_at
        BEFORE UPDATE ON scraper_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE scraper_configs IS 'External scraper service configurations';
COMMENT ON COLUMN scraper_configs.scraper_type IS 'Scraper service type: brightdata, firecrawl, octoparse, custom';
COMMENT ON COLUMN scraper_configs.api_key_encrypted IS 'Encrypted API key for the scraper service';
COMMENT ON COLUMN scraper_configs.additional_config IS 'Additional configuration like proxy settings, zones, etc.';
