-- =====================================================
-- COMBINED MIGRATIONS FOR MARKETPLACE SCRAPING SYSTEM
-- Run this entire file in Supabase SQL Editor
-- Safe to run multiple times (all statements are idempotent)
-- =====================================================

-- =====================================================
-- Migration 018: Create AI Agents Table
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    agent_type VARCHAR(50) NOT NULL,
    capabilities JSONB DEFAULT '[]'::jsonb,
    system_prompt TEXT,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,
    config JSONB DEFAULT '{}'::jsonb,
    total_tasks INTEGER DEFAULT 0,
    successful_tasks INTEGER DEFAULT 0,
    average_duration INTEGER,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_agents_provider ON ai_agents(provider);

-- =====================================================
-- Migration 019: Create Scraper Configs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS scraper_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scraper_type VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    api_endpoint TEXT,
    additional_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_tested_at TIMESTAMP,
    test_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scraper_configs_user_id ON scraper_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraper_configs_type ON scraper_configs(scraper_type);
CREATE INDEX IF NOT EXISTS idx_scraper_configs_active ON scraper_configs(is_active);

-- =====================================================
-- Migration 020: Create Marketplaces Table
-- =====================================================

CREATE TABLE IF NOT EXISTS marketplaces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    icon_url TEXT,
    base_url TEXT NOT NULL,
    language VARCHAR(10),
    category_filter VARCHAR(255),
    scraper_type VARCHAR(50) DEFAULT 'playwright',
    scraper_config JSONB DEFAULT '{}'::jsonb,
    agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL,
    max_products INTEGER DEFAULT 100,
    scrape_frequency VARCHAR(20) DEFAULT 'manual',
    auto_scrape_enabled BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ready',
    last_scraped_at TIMESTAMP,
    last_scrape_duration INTEGER,
    products_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplaces_user_id ON marketplaces(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_platform ON marketplaces(platform);
CREATE INDEX IF NOT EXISTS idx_marketplaces_status ON marketplaces(status);
CREATE INDEX IF NOT EXISTS idx_marketplaces_agent_id ON marketplaces(agent_id);
CREATE INDEX IF NOT EXISTS idx_marketplaces_auto_scrape ON marketplaces(auto_scrape_enabled) WHERE auto_scrape_enabled = true;

-- =====================================================
-- Migration 021: Create Scrape Sessions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS scrape_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marketplace_id INTEGER NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
    scraper_type VARCHAR(50) NOT NULL,
    agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL,
    config_snapshot JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    products_found INTEGER DEFAULT 0,
    products_new INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    logs JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    agent_observations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scrape_sessions_user_id ON scrape_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_marketplace_id ON scrape_sessions(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_status ON scrape_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_created_at ON scrape_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_agent_id ON scrape_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_scrape_sessions_active ON scrape_sessions(status) WHERE status IN ('pending', 'running');

-- =====================================================
-- Migration 022: Enhance Products Table
-- =====================================================

-- Marketplace relationship
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'marketplace_id') THEN
        ALTER TABLE products ADD COLUMN marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Scraping metadata
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scraped_at') THEN
        ALTER TABLE products ADD COLUMN scraped_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scrape_session_id') THEN
        ALTER TABLE products ADD COLUMN scrape_session_id VARCHAR(50) REFERENCES scrape_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Platform-specific metrics
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'temperature') THEN
        ALTER TABLE products ADD COLUMN temperature INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gravity') THEN
        ALTER TABLE products ADD COLUMN gravity DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'popularity_rank') THEN
        ALTER TABLE products ADD COLUMN popularity_rank INTEGER;
    END IF;
END $$;

-- AI scoring fields
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'demand_score') THEN
        ALTER TABLE products ADD COLUMN demand_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description_score') THEN
        ALTER TABLE products ADD COLUMN description_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_score') THEN
        ALTER TABLE products ADD COLUMN price_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'niche_score') THEN
        ALTER TABLE products ADD COLUMN niche_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'competition_score') THEN
        ALTER TABLE products ADD COLUMN competition_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visual_score') THEN
        ALTER TABLE products ADD COLUMN visual_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'overall_score') THEN
        ALTER TABLE products ADD COLUMN overall_score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'score_breakdown') THEN
        ALTER TABLE products ADD COLUMN score_breakdown JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scored_at') THEN
        ALTER TABLE products ADD COLUMN scored_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scored_by_agent_id') THEN
        ALTER TABLE products ADD COLUMN scored_by_agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- User interaction fields
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'commission_amount') THEN
        ALTER TABLE products ADD COLUMN commission_amount DECIMAL(10, 2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_affiliated') THEN
        ALTER TABLE products ADD COLUMN is_affiliated BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'affiliated_at') THEN
        ALTER TABLE products ADD COLUMN affiliated_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_notes') THEN
        ALTER TABLE products ADD COLUMN user_notes TEXT;
    END IF;
END $$;

-- Promotion tracking fields
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_promoted') THEN
        ALTER TABLE products ADD COLUMN is_promoted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promoted_at') THEN
        ALTER TABLE products ADD COLUMN promoted_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promotion_summary') THEN
        ALTER TABLE products ADD COLUMN promotion_summary TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'target_audience') THEN
        ALTER TABLE products ADD COLUMN target_audience TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promotion_strategy') THEN
        ALTER TABLE products ADD COLUMN promotion_strategy TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'roi_projection') THEN
        ALTER TABLE products ADD COLUMN roi_projection JSONB;
    END IF;
END $$;

-- Stage tracking
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stage') THEN
        ALTER TABLE products ADD COLUMN stage VARCHAR(20) DEFAULT 'discovery';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_content') THEN
        ALTER TABLE products ADD COLUMN has_content BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_landing_page') THEN
        ALTER TABLE products ADD COLUMN has_landing_page BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'has_active_campaign') THEN
        ALTER TABLE products ADD COLUMN has_active_campaign BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_marketplace_id ON products(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_products_scrape_session_id ON products(scrape_session_id);
CREATE INDEX IF NOT EXISTS idx_products_overall_score ON products(overall_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_stage ON products(stage);
CREATE INDEX IF NOT EXISTS idx_products_is_promoted ON products(is_promoted);
CREATE INDEX IF NOT EXISTS idx_products_is_affiliated ON products(is_affiliated);
CREATE INDEX IF NOT EXISTS idx_products_scored_by_agent ON products(scored_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_products_scraped_at ON products(scraped_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_discovery_scored ON products(overall_score DESC NULLS LAST) WHERE stage = 'discovery' AND overall_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_promoted ON products(promoted_at DESC) WHERE is_promoted = true;

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('ai_agents', 'scraper_configs', 'marketplaces', 'scrape_sessions');

-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'overall_score';
