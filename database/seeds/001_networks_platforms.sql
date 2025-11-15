-- AI-Automated Affiliate Marketing System
-- Seed Data: Networks and Platforms
-- Version: 1.0

-- ============================================================================
-- AFFILIATE NETWORKS
-- ============================================================================

INSERT INTO networks (name, slug, api_endpoint, status) VALUES
('ClickBank', 'clickbank', 'https://api.clickbank.com/rest/1.3', 'active'),
('ShareASale', 'shareasale', 'https://api.shareasale.com/w.cfm', 'active'),
('CJ Affiliate', 'cj', 'https://advertiser.cjaffiliates.com/api', 'active'),
('Impact', 'impact', 'https://api.impact.com/Mediapartners', 'active'),
('Amazon Associates', 'amazon', 'https://webservices.amazon.com/paapi5', 'active'),
('Awin', 'awin', 'https://api.awin.com', 'active'),
('Rakuten Advertising', 'rakuten', 'https://api.rakutenadvertising.com', 'active'),
('FlexOffers', 'flexoffers', 'https://api.flexoffers.com', 'active')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- ADVERTISING PLATFORMS
-- ============================================================================

INSERT INTO platforms (name, slug, api_endpoint, status) VALUES
('Meta Ads', 'meta', 'https://graph.facebook.com/v18.0', 'active'),
('Google Ads', 'google', 'https://googleads.googleapis.com/v15', 'active'),
('TikTok Ads', 'tiktok', 'https://business-api.tiktok.com/open_api/v1.3', 'active'),
('Microsoft Advertising', 'microsoft', 'https://ads.microsoft.com/Api/Advertiser/v13', 'inactive'),
('Twitter Ads', 'twitter', 'https://ads-api.twitter.com/12', 'inactive'),
('Pinterest Ads', 'pinterest', 'https://api.pinterest.com/v5', 'inactive'),
('Snapchat Ads', 'snapchat', 'https://adsapi.snapchat.com/v1', 'inactive'),
('LinkedIn Ads', 'linkedin', 'https://api.linkedin.com/v2', 'inactive')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DEFAULT SYSTEM SETTINGS
-- ============================================================================

INSERT INTO settings (key, value, type, description) VALUES
('auto_pause_roas_threshold', '1.5', 'number', 'ROAS threshold below which campaigns are auto-paused'),
('auto_scale_roas_threshold', '3.0', 'number', 'ROAS threshold above which campaigns are auto-scaled'),
('auto_scale_percentage', '20', 'number', 'Percentage to increase budget when auto-scaling'),
('creative_refresh_days', '21', 'number', 'Days after which creative should be refreshed'),
('min_spend_for_optimization', '100', 'number', 'Minimum spend before optimization actions are taken'),
('performance_sync_interval', '3600', 'number', 'Seconds between performance data syncs (1 hour)'),
('offer_sync_interval', '604800', 'number', 'Seconds between offer syncs (1 week)'),
('max_daily_budget', '10000', 'number', 'Maximum daily budget per campaign'),
('default_timezone', 'America/New_York', 'string', 'Default timezone for reporting'),
('currency', 'USD', 'string', 'Default currency'),
('email_notifications', 'true', 'boolean', 'Enable email notifications'),
('slack_notifications', 'false', 'boolean', 'Enable Slack notifications'),
('auto_optimization_enabled', 'true', 'boolean', 'Enable automatic optimization workflows')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEFAULT ADMIN USER (CHANGE PASSWORD AFTER FIRST LOGIN!)
-- ============================================================================

-- Password: ChangeMe123! (bcrypt hash)
-- YOU MUST CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
INSERT INTO users (email, password_hash, first_name, last_name, role, status) VALUES
('admin@localhost', '$2b$10$rKvVPPqK8QzN5xGxJxLxYeXKZJ8YqZJqZJqZJqZJqZJqZJqZJqZJq', 'Admin', 'User', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SAMPLE NICHES (for reference/filtering)
-- ============================================================================

-- Note: Niches are stored as VARCHAR in offers table, not a separate table
-- This is just documentation of common niches

-- Health & Fitness:
-- - Weight Loss
-- - Muscle Building
-- - Yoga & Meditation
-- - Nutrition & Supplements
-- - Fitness Programs

-- Personal Finance:
-- - Credit Repair
-- - Investment Education
-- - Budgeting Tools
-- - Cryptocurrency
-- - Debt Management

-- Online Education:
-- - Professional Development
-- - Language Learning
-- - Technical Skills
-- - Business Training
-- - Creative Skills

-- Technology:
-- - Software Tools
-- - Web Hosting
-- - VPN Services
-- - Security Tools
-- - Productivity Apps

-- Lifestyle:
-- - Dating & Relationships
-- - Self-Improvement
-- - Hobbies & Crafts
-- - Travel
-- - Fashion & Beauty

COMMENT ON TABLE networks IS 'Pre-populated with major affiliate networks. Add API keys via admin panel.';
COMMENT ON TABLE platforms IS 'Pre-populated with major ad platforms. Add API keys via admin panel.';
COMMENT ON TABLE settings IS 'System configuration. Modify via admin panel or API.';

