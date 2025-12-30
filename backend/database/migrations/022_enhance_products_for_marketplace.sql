-- =====================================================
-- Migration 022: Enhance Products Table for Marketplace Scraping
-- Purpose: Add columns for marketplace scraping, AI scoring, and promotions
-- Safe to run multiple times (idempotent)
-- =====================================================

-- Add marketplace relationship column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'marketplace_id') THEN
        ALTER TABLE products ADD COLUMN marketplace_id INTEGER REFERENCES marketplaces(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add scraping metadata columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scraped_at') THEN
        ALTER TABLE products ADD COLUMN scraped_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scrape_session_id') THEN
        ALTER TABLE products ADD COLUMN scrape_session_id VARCHAR(50) REFERENCES scrape_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add platform-specific metrics columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'temperature') THEN
        ALTER TABLE products ADD COLUMN temperature INTEGER;      -- Hotmart metric
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gravity') THEN
        ALTER TABLE products ADD COLUMN gravity DECIMAL(10, 2);   -- ClickBank metric
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'popularity_rank') THEN
        ALTER TABLE products ADD COLUMN popularity_rank INTEGER;
    END IF;
END $$;

-- Add AI scoring fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'demand_score') THEN
        ALTER TABLE products ADD COLUMN demand_score INTEGER;     -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description_score') THEN
        ALTER TABLE products ADD COLUMN description_score INTEGER; -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_score') THEN
        ALTER TABLE products ADD COLUMN price_score INTEGER;      -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'niche_score') THEN
        ALTER TABLE products ADD COLUMN niche_score INTEGER;      -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'competition_score') THEN
        ALTER TABLE products ADD COLUMN competition_score INTEGER; -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visual_score') THEN
        ALTER TABLE products ADD COLUMN visual_score INTEGER;     -- 0-100
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'overall_score') THEN
        ALTER TABLE products ADD COLUMN overall_score INTEGER;    -- 0-100 (weighted avg)
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'score_breakdown') THEN
        ALTER TABLE products ADD COLUMN score_breakdown JSONB;    -- Detailed breakdown
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scored_at') THEN
        ALTER TABLE products ADD COLUMN scored_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'scored_by_agent_id') THEN
        ALTER TABLE products ADD COLUMN scored_by_agent_id INTEGER REFERENCES ai_agents(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add user interaction fields (check if they don't already exist from earlier migrations)
DO $$
BEGIN
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

-- Add promotion tracking fields (for Offers)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_promoted') THEN
        ALTER TABLE products ADD COLUMN is_promoted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promoted_at') THEN
        ALTER TABLE products ADD COLUMN promoted_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promotion_summary') THEN
        ALTER TABLE products ADD COLUMN promotion_summary TEXT;   -- AI-generated summary
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'target_audience') THEN
        ALTER TABLE products ADD COLUMN target_audience TEXT;     -- AI-generated
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'promotion_strategy') THEN
        ALTER TABLE products ADD COLUMN promotion_strategy TEXT;  -- AI-generated
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'roi_projection') THEN
        ALTER TABLE products ADD COLUMN roi_projection JSONB;     -- {min, avg, max, assumptions}
    END IF;
END $$;

-- Add stage tracking columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stage') THEN
        ALTER TABLE products ADD COLUMN stage VARCHAR(20) DEFAULT 'discovery'; -- 'discovery', 'offer', 'archived'
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_marketplace_id ON products(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_products_scrape_session_id ON products(scrape_session_id);
CREATE INDEX IF NOT EXISTS idx_products_overall_score ON products(overall_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_stage ON products(stage);
CREATE INDEX IF NOT EXISTS idx_products_is_promoted ON products(is_promoted);
CREATE INDEX IF NOT EXISTS idx_products_is_affiliated ON products(is_affiliated);
CREATE INDEX IF NOT EXISTS idx_products_scored_by_agent ON products(scored_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_products_scraped_at ON products(scraped_at DESC NULLS LAST);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_discovery_scored ON products(overall_score DESC NULLS LAST)
WHERE stage = 'discovery' AND overall_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_promoted ON products(promoted_at DESC)
WHERE is_promoted = true;

-- Add comments
COMMENT ON COLUMN products.marketplace_id IS 'Reference to the marketplace this product was scraped from';
COMMENT ON COLUMN products.scraped_at IS 'When the product was last scraped';
COMMENT ON COLUMN products.temperature IS 'Hotmart temperature metric';
COMMENT ON COLUMN products.gravity IS 'ClickBank gravity metric';
COMMENT ON COLUMN products.overall_score IS 'AI-calculated overall score 0-100';
COMMENT ON COLUMN products.score_breakdown IS 'Detailed breakdown of AI scoring';
COMMENT ON COLUMN products.stage IS 'Product lifecycle stage: discovery, offer, archived';
COMMENT ON COLUMN products.is_promoted IS 'Whether product has been promoted to Offers';
COMMENT ON COLUMN products.roi_projection IS 'AI-generated ROI projection with min, avg, max values';
