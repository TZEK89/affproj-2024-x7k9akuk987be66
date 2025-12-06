-- =====================================================
-- Migration 006: Campaigns Tables
-- Purpose: Campaign management, tracking, and optimization
-- =====================================================

-- Main campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'organic', 'paid', 'email', 'social'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'archived'
    budget DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    goal_type VARCHAR(50), -- 'conversions', 'clicks', 'revenue', 'roi'
    goal_value DECIMAL(10, 2),
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products associated with campaigns
CREATE TABLE IF NOT EXISTS campaign_products (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0, -- Higher priority products get more focus
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, product_id)
);

-- Marketing channels used in campaigns
CREATE TABLE IF NOT EXISTS campaign_channels (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL, -- 'facebook', 'google', 'email', 'organic', 'instagram', 'tiktok'
    channel_name VARCHAR(255),
    channel_config JSONB DEFAULT '{}', -- Store channel-specific settings
    budget_allocation DECIMAL(5, 2), -- Percentage of total budget (0-100)
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily campaign metrics
CREATE TABLE IF NOT EXISTS campaign_metrics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_id INTEGER REFERENCES campaign_channels(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    ctr DECIMAL(5, 2), -- Click-through rate (%)
    conversion_rate DECIMAL(5, 2), -- Conversion rate (%)
    cpc DECIMAL(10, 4), -- Cost per click
    cpa DECIMAL(10, 2), -- Cost per acquisition
    roas DECIMAL(10, 2), -- Return on ad spend
    roi DECIMAL(10, 2), -- Return on investment (%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, channel_id, date)
);

-- Campaign A/B test variants
CREATE TABLE IF NOT EXISTS campaign_variants (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- 'A', 'B', 'C', etc.
    variant_type VARCHAR(50) NOT NULL, -- 'copy', 'image', 'cta', 'landing_page', 'audience'
    config JSONB NOT NULL, -- Store variant-specific configuration
    traffic_split DECIMAL(5, 2) DEFAULT 50.00, -- Percentage of traffic (0-100)
    is_control BOOLEAN DEFAULT false,
    performance_score DECIMAL(10, 4), -- Calculated performance score
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'winner', 'loser'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign optimization history
CREATE TABLE IF NOT EXISTS campaign_optimizations (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL, -- 'budget', 'targeting', 'creative', 'bidding', 'schedule'
    changes JSONB NOT NULL, -- Store what was changed
    reason TEXT, -- AI reasoning for the optimization
    impact_prediction JSONB, -- Predicted impact metrics
    actual_impact JSONB, -- Actual impact after implementation
    implemented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_at TIMESTAMP, -- When impact was measured
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'applied', 'reverted', 'success', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B tests management
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL, -- 'copy', 'image', 'cta', 'landing_page', 'audience', 'budget'
    hypothesis TEXT, -- What we're testing
    success_metric VARCHAR(50) NOT NULL, -- 'conversions', 'revenue', 'ctr', 'roi'
    confidence_level DECIMAL(5, 2) DEFAULT 95.00, -- Statistical confidence required (%)
    min_sample_size INTEGER DEFAULT 100, -- Minimum conversions needed
    current_sample_size INTEGER DEFAULT 0,
    winner_variant_id INTEGER REFERENCES campaign_variants(id) ON DELETE SET NULL,
    statistical_significance DECIMAL(5, 2), -- Calculated significance (%)
    status VARCHAR(50) DEFAULT 'running', -- 'draft', 'running', 'completed', 'inconclusive', 'stopped'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign notes and insights
CREATE TABLE IF NOT EXISTS campaign_notes (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    note_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ai_insight', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(started_at, ended_at);

CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign_id ON campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_product_id ON campaign_products(product_id);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign_id ON campaign_channels(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_type ON campaign_channels(channel_type);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_date ON campaign_metrics(campaign_id, date);

CREATE INDEX IF NOT EXISTS idx_campaign_variants_campaign_id ON campaign_variants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_variants_status ON campaign_variants(status);

CREATE INDEX IF NOT EXISTS idx_campaign_optimizations_campaign_id ON campaign_optimizations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_optimizations_type ON campaign_optimizations(optimization_type);

CREATE INDEX IF NOT EXISTS idx_ab_tests_campaign_id ON ab_tests(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_campaign_notes_campaign_id ON campaign_notes(campaign_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_channels_updated_at BEFORE UPDATE ON campaign_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_metrics_updated_at BEFORE UPDATE ON campaign_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_variants_updated_at BEFORE UPDATE ON campaign_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
