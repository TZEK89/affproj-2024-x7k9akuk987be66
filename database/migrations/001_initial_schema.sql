-- AI-Automated Affiliate Marketing System
-- Initial Database Schema
-- Version: 1.0
-- Database: PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Networks table (affiliate networks)
CREATE TABLE networks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platforms table (ad platforms)
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    api_endpoint VARCHAR(255),
    api_key_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Offers table (affiliate offers)
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
    external_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    niche VARCHAR(100),
    category VARCHAR(100),
    commission_type VARCHAR(20) CHECK (commission_type IN ('percentage', 'fixed', 'cpa', 'cpl')),
    commission_value DECIMAL(10, 2),
    commission_percentage DECIMAL(5, 2),
    epc DECIMAL(10, 2), -- Earnings Per Click
    conversion_rate DECIMAL(5, 2),
    refund_rate DECIMAL(5, 2),
    gravity INTEGER, -- ClickBank specific
    landing_page_url TEXT,
    tracking_url TEXT,
    restrictions TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'archived')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(network_id, external_id)
);

-- Assets table (creative content)
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'copy', 'audio')),
    ai_tool VARCHAR(50), -- midjourney, runway, claude, elevenlabs
    file_url TEXT,
    file_size INTEGER, -- in bytes
    dimensions VARCHAR(20), -- e.g., "1080x1920"
    duration INTEGER, -- for videos/audio, in seconds
    prompt TEXT,
    generation_cost DECIMAL(10, 4),
    performance_score DECIMAL(5, 2),
    usage_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing Pages table
CREATE TABLE landing_pages (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    template VARCHAR(50),
    url TEXT NOT NULL,
    headline TEXT,
    subheadline TEXT,
    body_content TEXT,
    cta_text VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    conversion_rate DECIMAL(5, 2),
    visits INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    landing_page_id INTEGER REFERENCES landing_pages(id) ON DELETE SET NULL,
    external_id VARCHAR(100), -- platform campaign ID
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
    budget_daily DECIMAL(10, 2),
    budget_total DECIMAL(10, 2),
    bid_strategy VARCHAR(50),
    targeting JSONB, -- targeting parameters
    start_date DATE,
    end_date DATE,
    -- Performance metrics
    spend DECIMAL(10, 2) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    profit DECIMAL(10, 2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5, 2), -- Click-through rate
    cpc DECIMAL(10, 2), -- Cost per click
    cpa DECIMAL(10, 2), -- Cost per acquisition
    roas DECIMAL(10, 2), -- Return on ad spend
    last_synced_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Assets junction table (many-to-many)
CREATE TABLE campaign_assets (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, asset_id)
);

-- Clicks table (tracking)
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    landing_page_id INTEGER REFERENCES landing_pages(id) ON DELETE SET NULL,
    click_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    visitor_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    device VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversions table
CREATE TABLE conversions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    click_id INTEGER REFERENCES clicks(id) ON DELETE SET NULL,
    offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE,
    commission_amount DECIMAL(10, 2),
    sale_amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reversed')),
    conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approval_date TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (system configuration)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    type VARCHAR(20) CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation Logs table
CREATE TABLE automation_logs (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(100),
    action VARCHAR(100),
    entity_type VARCHAR(50), -- campaign, offer, asset, etc.
    entity_id INTEGER,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Offers indexes
CREATE INDEX idx_offers_network_id ON offers(network_id);
CREATE INDEX idx_offers_niche ON offers(niche);
CREATE INDEX idx_offers_quality_score ON offers(quality_score DESC);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);

-- Assets indexes
CREATE INDEX idx_assets_offer_id ON assets(offer_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_ai_tool ON assets(ai_tool);
CREATE INDEX idx_assets_performance_score ON assets(performance_score DESC);

-- Landing Pages indexes
CREATE INDEX idx_landing_pages_offer_id ON landing_pages(offer_id);
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_conversion_rate ON landing_pages(conversion_rate DESC);

-- Campaigns indexes
CREATE INDEX idx_campaigns_offer_id ON campaigns(offer_id);
CREATE INDEX idx_campaigns_platform_id ON campaigns(platform_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_roas ON campaigns(roas DESC);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Clicks indexes
CREATE INDEX idx_clicks_campaign_id ON clicks(campaign_id);
CREATE INDEX idx_clicks_click_id ON clicks(click_id);
CREATE INDEX idx_clicks_visitor_id ON clicks(visitor_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at DESC);
CREATE INDEX idx_clicks_country ON clicks(country);

-- Conversions indexes
CREATE INDEX idx_conversions_campaign_id ON conversions(campaign_id);
CREATE INDEX idx_conversions_offer_id ON conversions(offer_id);
CREATE INDEX idx_conversions_transaction_id ON conversions(transaction_id);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_conversion_date ON conversions(conversion_date DESC);

-- Automation Logs indexes
CREATE INDEX idx_automation_logs_workflow_name ON automation_logs(workflow_name);
CREATE INDEX idx_automation_logs_entity_type_id ON automation_logs(entity_type, entity_id);
CREATE INDEX idx_automation_logs_created_at ON automation_logs(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_networks_updated_at BEFORE UPDATE ON networks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platforms_updated_at BEFORE UPDATE ON platforms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC METRIC CALCULATIONS
-- ============================================================================

-- Calculate campaign metrics when conversions are added/updated
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE campaigns
    SET 
        revenue = (SELECT COALESCE(SUM(commission_amount), 0) FROM conversions WHERE campaign_id = NEW.campaign_id AND status = 'approved'),
        conversions = (SELECT COUNT(*) FROM conversions WHERE campaign_id = NEW.campaign_id AND status = 'approved'),
        profit = revenue - spend,
        roas = CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END,
        cpa = CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END
    WHERE id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_metrics_on_conversion AFTER INSERT OR UPDATE ON conversions
    FOR EACH ROW EXECUTE FUNCTION update_campaign_metrics();

-- Calculate landing page metrics when clicks/conversions occur
CREATE OR REPLACE FUNCTION update_landing_page_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE landing_pages
    SET 
        visits = (SELECT COUNT(*) FROM clicks WHERE landing_page_id = NEW.landing_page_id),
        conversions = (SELECT COUNT(*) FROM conversions c JOIN clicks cl ON c.click_id = cl.id WHERE cl.landing_page_id = NEW.landing_page_id AND c.status = 'approved'),
        conversion_rate = CASE WHEN visits > 0 THEN (conversions::DECIMAL / visits::DECIMAL) * 100 ELSE 0 END
    WHERE id = NEW.landing_page_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_page_metrics_on_click AFTER INSERT ON clicks
    FOR EACH ROW EXECUTE FUNCTION update_landing_page_metrics();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE networks IS 'Affiliate networks (ClickBank, ShareASale, CJ, etc.)';
COMMENT ON TABLE platforms IS 'Advertising platforms (Meta, Google, TikTok, etc.)';
COMMENT ON TABLE offers IS 'Affiliate offers from various networks';
COMMENT ON TABLE assets IS 'Creative assets (images, videos, copy) generated by AI';
COMMENT ON TABLE landing_pages IS 'Landing pages for affiliate offers';
COMMENT ON TABLE campaigns IS 'Advertising campaigns on various platforms';
COMMENT ON TABLE clicks IS 'Click tracking data';
COMMENT ON TABLE conversions IS 'Conversion tracking data';
COMMENT ON TABLE automation_logs IS 'Logs of automated actions performed by the system';

COMMENT ON COLUMN offers.quality_score IS 'Calculated quality score (0-100) based on EPC, conversion rate, refund rate, etc.';
COMMENT ON COLUMN campaigns.roas IS 'Return on Ad Spend (revenue / spend)';
COMMENT ON COLUMN campaigns.ctr IS 'Click-Through Rate (clicks / impressions * 100)';
COMMENT ON COLUMN campaigns.cpc IS 'Cost Per Click (spend / clicks)';
COMMENT ON COLUMN campaigns.cpa IS 'Cost Per Acquisition (spend / conversions)';

