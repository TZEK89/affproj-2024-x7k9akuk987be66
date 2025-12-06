-- =====================================================
-- Migration 012: Comprehensive Database Fix
-- Purpose: Fix all table structures, add missing columns, repair constraints
-- Safe to run multiple times (idempotent)
-- =====================================================

-- =====================================================
-- PART 1: Fix users table (ensure all columns exist)
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- =====================================================
-- PART 2: Fix campaigns table
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'user_id') THEN
        ALTER TABLE campaigns ADD COLUMN user_id INTEGER;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS campaign_products (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    product_id INTEGER,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, product_id)
);

CREATE TABLE IF NOT EXISTS campaign_channels (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    channel_type VARCHAR(50) NOT NULL,
    channel_name VARCHAR(255),
    channel_config JSONB DEFAULT '{}',
    budget_allocation DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_metrics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    channel_id INTEGER,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(5, 2),
    conversion_rate DECIMAL(5, 2),
    cpc DECIMAL(10, 4),
    cpa DECIMAL(10, 2),
    roas DECIMAL(10, 2),
    roi DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_variants (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    variant_name VARCHAR(100) NOT NULL,
    variant_type VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    traffic_split DECIMAL(5, 2) DEFAULT 50.00,
    is_control BOOLEAN DEFAULT false,
    performance_score DECIMAL(10, 4),
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_optimizations (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    optimization_type VARCHAR(50) NOT NULL,
    changes JSONB NOT NULL DEFAULT '{}',
    reason TEXT,
    impact_prediction JSONB,
    actual_impact JSONB,
    implemented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL,
    hypothesis TEXT,
    success_metric VARCHAR(50) NOT NULL,
    confidence_level DECIMAL(5, 2) DEFAULT 95.00,
    min_sample_size INTEGER DEFAULT 100,
    current_sample_size INTEGER DEFAULT 0,
    winner_variant_id INTEGER,
    statistical_significance DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'running',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_notes (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER,
    user_id INTEGER,
    note_type VARCHAR(50) DEFAULT 'manual',
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PART 3: Fix landing_pages table
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_pages' AND column_name = 'user_id') THEN
        ALTER TABLE landing_pages ADD COLUMN user_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'landing_pages' AND column_name = 'campaign_id') THEN
        ALTER TABLE landing_pages ADD COLUMN campaign_id INTEGER;
    END IF;
END $$;

-- =====================================================
-- PART 4: Fix conversions table
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversions' AND column_name = 'user_id') THEN
        ALTER TABLE conversions ADD COLUMN user_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversions' AND column_name = 'campaign_id') THEN
        ALTER TABLE conversions ADD COLUMN campaign_id INTEGER;
    END IF;
END $$;

-- =====================================================
-- PART 5: Create agent_missions table (for Core #1)
-- =====================================================

CREATE TABLE IF NOT EXISTS agent_missions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    mission_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    agents JSONB DEFAULT '[]',
    parameters JSONB DEFAULT '{}',
    results JSONB DEFAULT '[]',
    aggregated_results JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER,
    agent_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB DEFAULT '{}',
    screenshot_url TEXT,
    result JSONB,
    duration_ms INTEGER,
    status VARCHAR(50) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discovered_products (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER,
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    commission_rate DECIMAL(5, 2),
    commission_type VARCHAR(50),
    category VARCHAR(255),
    niche VARCHAR(255),
    gravity_score DECIMAL(10, 2),
    conversion_rate DECIMAL(5, 2),
    refund_rate DECIMAL(5, 2),
    avg_ticket DECIMAL(10, 2),
    vendor_name VARCHAR(255),
    product_url TEXT,
    sales_page_url TEXT,
    image_url TEXT,
    ai_score DECIMAL(5, 2),
    ai_analysis JSONB,
    is_recommended BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'discovered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, external_id)
);

-- =====================================================
-- PART 6: Create indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign_id ON campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_product_id ON campaign_products(product_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(date);
CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_campaign_id ON landing_pages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_campaign_id ON conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_agent_missions_user_id ON agent_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_missions_status ON agent_missions(status);
CREATE INDEX IF NOT EXISTS idx_agent_missions_platform ON agent_missions(platform);
CREATE INDEX IF NOT EXISTS idx_agent_logs_mission_id ON agent_logs(mission_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_discovered_products_mission_id ON discovered_products(mission_id);
CREATE INDEX IF NOT EXISTS idx_discovered_products_platform ON discovered_products(platform);
CREATE INDEX IF NOT EXISTS idx_discovered_products_niche ON discovered_products(niche);
CREATE INDEX IF NOT EXISTS idx_discovered_products_status ON discovered_products(status);
CREATE INDEX IF NOT EXISTS idx_discovered_products_ai_score ON discovered_products(ai_score);

-- =====================================================
-- PART 7: Add update triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agent_missions_updated_at') THEN
        CREATE TRIGGER update_agent_missions_updated_at 
        BEFORE UPDATE ON agent_missions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_discovered_products_updated_at') THEN
        CREATE TRIGGER update_discovered_products_updated_at 
        BEFORE UPDATE ON discovered_products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
