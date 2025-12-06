-- =====================================================
-- Migration 007: Landing Pages Tables
-- Purpose: Landing page management, templates, A/B testing, and analytics
-- =====================================================

-- Landing page templates
CREATE TABLE IF NOT EXISTS landing_page_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL for system templates
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'ecommerce', 'saas', 'course', 'ebook', 'webinar'
    style VARCHAR(50), -- 'modern', 'minimal', 'bold', 'elegant', 'playful'
    html_template TEXT NOT NULL, -- HTML with placeholders like {{product_name}}
    css TEXT, -- Custom CSS
    js TEXT, -- Custom JavaScript
    preview_image_url TEXT,
    is_system_template BOOLEAN DEFAULT false, -- System templates can't be deleted
    conversion_rate DECIMAL(5, 2), -- Average conversion rate for this template
    usage_count INTEGER DEFAULT 0, -- How many times used
    rating DECIMAL(3, 2), -- User rating (1-5)
    metadata JSONB DEFAULT '{}', -- Template configuration options
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing pages
CREATE TABLE IF NOT EXISTS landing_pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    template_id INTEGER REFERENCES landing_page_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier
    url TEXT, -- Full deployed URL (e.g., https://offer-123.vercel.app)
    deployment_id TEXT, -- Vercel/Cloudflare deployment ID
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived', 'testing'
    
    -- Page content (can override template)
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_image_url TEXT, -- Open Graph image
    
    -- Configuration
    custom_domain VARCHAR(255), -- Custom domain if configured
    tracking_code TEXT, -- Google Analytics, Facebook Pixel, etc.
    conversion_goal VARCHAR(50), -- 'click', 'form_submit', 'purchase'
    
    -- Performance
    page_speed_score INTEGER, -- Google PageSpeed score (0-100)
    mobile_score INTEGER, -- Mobile performance score
    seo_score INTEGER, -- SEO score (0-100)
    
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, slug)
);

-- Landing page A/B test variants
CREATE TABLE IF NOT EXISTS landing_page_variants (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL, -- 'A', 'B', 'C', etc.
    is_control BOOLEAN DEFAULT false,
    
    -- What's different in this variant
    changes JSONB NOT NULL, -- Store specific changes from control
    
    -- Traffic allocation
    traffic_split DECIMAL(5, 2) DEFAULT 50.00, -- Percentage of traffic (0-100)
    
    -- Content overrides (if different from main page)
    html_override TEXT,
    css_override TEXT,
    js_override TEXT,
    
    -- Deployment
    url TEXT, -- Variant-specific URL
    deployment_id TEXT,
    
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'winner', 'loser'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing page analytics (daily aggregates)
CREATE TABLE IF NOT EXISTS landing_page_analytics (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES landing_page_variants(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    
    -- Traffic metrics
    visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    
    -- Engagement metrics
    avg_time_on_page INTEGER, -- Seconds
    bounce_rate DECIMAL(5, 2), -- Percentage
    scroll_depth DECIMAL(5, 2), -- Average scroll depth (%)
    
    -- Conversion metrics
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2), -- Percentage
    conversion_value DECIMAL(10, 2), -- Total value from conversions
    
    -- Traffic sources
    source_direct INTEGER DEFAULT 0,
    source_organic INTEGER DEFAULT 0,
    source_social INTEGER DEFAULT 0,
    source_paid INTEGER DEFAULT 0,
    source_email INTEGER DEFAULT 0,
    source_referral INTEGER DEFAULT 0,
    
    -- Device breakdown
    device_desktop INTEGER DEFAULT 0,
    device_mobile INTEGER DEFAULT 0,
    device_tablet INTEGER DEFAULT 0,
    
    -- Geographic data
    top_countries JSONB DEFAULT '[]', -- Array of {country, visits}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id, variant_id, date)
);

-- Landing page visitor sessions
CREATE TABLE IF NOT EXISTS landing_page_sessions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES landing_page_variants(id) ON DELETE SET NULL,
    
    -- Session identification
    session_id VARCHAR(255) NOT NULL,
    visitor_id VARCHAR(255), -- Anonymous visitor ID (cookie-based)
    
    -- Visit details
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45), -- IPv6 compatible
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Referrer
    referrer_url TEXT,
    referrer_source VARCHAR(50), -- 'google', 'facebook', 'direct', etc.
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_content VARCHAR(100),
    utm_term VARCHAR(100),
    
    -- Engagement
    time_on_page INTEGER, -- Seconds
    scroll_depth DECIMAL(5, 2), -- Max scroll depth (%)
    clicks_count INTEGER DEFAULT 0,
    
    -- Conversion
    converted BOOLEAN DEFAULT false,
    converted_at TIMESTAMP,
    conversion_value DECIMAL(10, 2),
    
    -- Device
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing page elements (for heatmap tracking)
CREATE TABLE IF NOT EXISTS landing_page_elements (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    element_id VARCHAR(255) NOT NULL, -- HTML element ID or class
    element_type VARCHAR(50) NOT NULL, -- 'button', 'link', 'form', 'image', 'video'
    element_label VARCHAR(255), -- Human-readable label
    position_x INTEGER, -- X coordinate on page
    position_y INTEGER, -- Y coordinate on page
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(page_id, element_id)
);

-- Landing page element clicks (for heatmap)
CREATE TABLE IF NOT EXISTS landing_page_element_clicks (
    id SERIAL PRIMARY KEY,
    element_id INTEGER NOT NULL REFERENCES landing_page_elements(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES landing_page_sessions(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    click_x INTEGER, -- Exact click X coordinate
    click_y INTEGER, -- Exact click Y coordinate
    device_type VARCHAR(50)
);

-- Landing page A/B tests
CREATE TABLE IF NOT EXISTS landing_page_ab_tests (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    hypothesis TEXT, -- What we're testing
    test_type VARCHAR(50) NOT NULL, -- 'headline', 'cta', 'image', 'layout', 'color', 'copy'
    success_metric VARCHAR(50) NOT NULL, -- 'conversion_rate', 'time_on_page', 'bounce_rate', 'scroll_depth'
    
    -- Statistical requirements
    confidence_level DECIMAL(5, 2) DEFAULT 95.00, -- Required confidence (%)
    min_sample_size INTEGER DEFAULT 100, -- Minimum visitors per variant
    current_sample_size INTEGER DEFAULT 0,
    
    -- Results
    winner_variant_id INTEGER REFERENCES landing_page_variants(id) ON DELETE SET NULL,
    statistical_significance DECIMAL(5, 2), -- Calculated significance (%)
    improvement_percentage DECIMAL(5, 2), -- How much better winner is (%)
    
    status VARCHAR(50) DEFAULT 'running', -- 'draft', 'running', 'completed', 'inconclusive', 'stopped'
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing page optimization suggestions
CREATE TABLE IF NOT EXISTS landing_page_optimizations (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50) NOT NULL, -- 'speed', 'seo', 'conversion', 'mobile', 'accessibility'
    priority VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL, -- What to do
    impact_score INTEGER, -- Estimated impact (1-100)
    effort_score INTEGER, -- Estimated effort (1-100)
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'applied', 'dismissed', 'scheduled'
    applied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_landing_page_templates_user_id ON landing_page_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_templates_category ON landing_page_templates(category);
CREATE INDEX IF NOT EXISTS idx_landing_page_templates_system ON landing_page_templates(is_system_template);

CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_product_id ON landing_pages(product_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_campaign_id ON landing_pages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);

CREATE INDEX IF NOT EXISTS idx_landing_page_variants_page_id ON landing_page_variants(page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_variants_status ON landing_page_variants(status);

CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_page_id ON landing_page_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_date ON landing_page_analytics(date);
CREATE INDEX IF NOT EXISTS idx_landing_page_analytics_page_date ON landing_page_analytics(page_id, date);

CREATE INDEX IF NOT EXISTS idx_landing_page_sessions_page_id ON landing_page_sessions(page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_sessions_session_id ON landing_page_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_sessions_visitor_id ON landing_page_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_sessions_visited_at ON landing_page_sessions(visited_at);

CREATE INDEX IF NOT EXISTS idx_landing_page_elements_page_id ON landing_page_elements(page_id);

CREATE INDEX IF NOT EXISTS idx_landing_page_element_clicks_element_id ON landing_page_element_clicks(element_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_element_clicks_session_id ON landing_page_element_clicks(session_id);

CREATE INDEX IF NOT EXISTS idx_landing_page_ab_tests_page_id ON landing_page_ab_tests(page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_ab_tests_status ON landing_page_ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_landing_page_optimizations_page_id ON landing_page_optimizations(page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_optimizations_status ON landing_page_optimizations(status);

-- Add triggers for updated_at
CREATE TRIGGER update_landing_page_templates_updated_at BEFORE UPDATE ON landing_page_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON landing_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_page_variants_updated_at BEFORE UPDATE ON landing_page_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_page_analytics_updated_at BEFORE UPDATE ON landing_page_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landing_page_ab_tests_updated_at BEFORE UPDATE ON landing_page_ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
