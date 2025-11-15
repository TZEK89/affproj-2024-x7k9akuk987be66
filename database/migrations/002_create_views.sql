-- AI-Automated Affiliate Marketing System
-- Database Views for Common Queries
-- Version: 1.0

-- ============================================================================
-- CAMPAIGN PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
    c.id,
    c.name,
    c.status,
    o.name AS offer_name,
    o.niche,
    p.name AS platform_name,
    c.spend,
    c.revenue,
    c.profit,
    c.impressions,
    c.clicks,
    c.conversions,
    c.ctr,
    c.cpc,
    c.cpa,
    c.roas,
    c.budget_daily,
    c.budget_total,
    CASE 
        WHEN c.spend > 0 THEN (c.profit / c.spend) * 100
        ELSE 0 
    END AS roi_percentage,
    c.start_date,
    c.end_date,
    c.created_at,
    c.last_synced_at
FROM campaigns c
LEFT JOIN offers o ON c.offer_id = o.id
LEFT JOIN platforms p ON c.platform_id = p.id;

COMMENT ON VIEW campaign_performance IS 'Comprehensive campaign performance metrics with related offer and platform information';

-- ============================================================================
-- OFFER PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW offer_performance AS
SELECT 
    o.id,
    o.name,
    o.niche,
    o.category,
    n.name AS network_name,
    o.commission_type,
    o.commission_value,
    o.commission_percentage,
    o.epc,
    o.conversion_rate AS offer_conversion_rate,
    o.quality_score,
    o.status,
    COUNT(DISTINCT c.id) AS campaign_count,
    COUNT(DISTINCT lp.id) AS landing_page_count,
    COALESCE(SUM(c.spend), 0) AS total_spend,
    COALESCE(SUM(c.revenue), 0) AS total_revenue,
    COALESCE(SUM(c.profit), 0) AS total_profit,
    COALESCE(SUM(c.clicks), 0) AS total_clicks,
    COALESCE(SUM(c.conversions), 0) AS total_conversions,
    CASE 
        WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
        ELSE 0 
    END AS avg_roas,
    CASE 
        WHEN SUM(c.clicks) > 0 THEN SUM(c.conversions)::DECIMAL / SUM(c.clicks)::DECIMAL * 100
        ELSE 0 
    END AS actual_conversion_rate,
    o.created_at
FROM offers o
LEFT JOIN networks n ON o.network_id = n.id
LEFT JOIN campaigns c ON o.id = c.offer_id
LEFT JOIN landing_pages lp ON o.id = lp.offer_id
GROUP BY o.id, o.name, o.niche, o.category, n.name, o.commission_type, 
         o.commission_value, o.commission_percentage, o.epc, o.conversion_rate, 
         o.quality_score, o.status, o.created_at;

COMMENT ON VIEW offer_performance IS 'Aggregated performance metrics for each offer across all campaigns';

-- ============================================================================
-- DAILY PERFORMANCE SUMMARY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW daily_performance_summary AS
SELECT 
    DATE(cl.created_at) AS date,
    COUNT(DISTINCT cl.id) AS total_clicks,
    COUNT(DISTINCT CASE WHEN cv.status = 'approved' THEN cv.id END) AS total_conversions,
    COALESCE(SUM(CASE WHEN cv.status = 'approved' THEN cv.commission_amount END), 0) AS total_revenue,
    COALESCE(SUM(c.spend), 0) AS total_spend,
    COALESCE(SUM(CASE WHEN cv.status = 'approved' THEN cv.commission_amount END), 0) - COALESCE(SUM(c.spend), 0) AS total_profit,
    CASE 
        WHEN SUM(c.spend) > 0 THEN SUM(CASE WHEN cv.status = 'approved' THEN cv.commission_amount END) / SUM(c.spend)
        ELSE 0 
    END AS avg_roas,
    CASE 
        WHEN COUNT(cl.id) > 0 THEN COUNT(CASE WHEN cv.status = 'approved' THEN cv.id END)::DECIMAL / COUNT(cl.id)::DECIMAL * 100
        ELSE 0 
    END AS conversion_rate
FROM clicks cl
LEFT JOIN conversions cv ON cl.id = cv.click_id
LEFT JOIN campaigns c ON cl.campaign_id = c.id
GROUP BY DATE(cl.created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_performance_summary IS 'Daily aggregated performance metrics across all campaigns';

-- ============================================================================
-- TOP PERFORMING ASSETS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW top_performing_assets AS
SELECT 
    a.id,
    a.type,
    a.ai_tool,
    a.file_url,
    o.name AS offer_name,
    o.niche,
    a.usage_count,
    a.performance_score,
    a.generation_cost,
    COUNT(DISTINCT ca.campaign_id) AS campaign_count,
    COALESCE(SUM(c.revenue), 0) AS total_revenue_generated,
    COALESCE(SUM(c.conversions), 0) AS total_conversions,
    CASE 
        WHEN a.generation_cost > 0 THEN SUM(c.revenue) / a.generation_cost
        ELSE 0 
    END AS roi_on_generation_cost,
    a.created_at
FROM assets a
LEFT JOIN offers o ON a.offer_id = o.id
LEFT JOIN campaign_assets ca ON a.id = ca.asset_id
LEFT JOIN campaigns c ON ca.campaign_id = c.id
WHERE a.status = 'active'
GROUP BY a.id, a.type, a.ai_tool, a.file_url, o.name, o.niche, 
         a.usage_count, a.performance_score, a.generation_cost, a.created_at
ORDER BY total_revenue_generated DESC;

COMMENT ON VIEW top_performing_assets IS 'Top performing creative assets ranked by revenue generated';

-- ============================================================================
-- NETWORK PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW network_performance AS
SELECT 
    n.id,
    n.name,
    n.status,
    COUNT(DISTINCT o.id) AS offer_count,
    COUNT(DISTINCT c.id) AS campaign_count,
    COALESCE(SUM(c.spend), 0) AS total_spend,
    COALESCE(SUM(c.revenue), 0) AS total_revenue,
    COALESCE(SUM(c.profit), 0) AS total_profit,
    COALESCE(SUM(c.conversions), 0) AS total_conversions,
    CASE 
        WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
        ELSE 0 
    END AS avg_roas,
    AVG(o.quality_score) AS avg_offer_quality_score,
    n.last_sync_at,
    n.created_at
FROM networks n
LEFT JOIN offers o ON n.id = o.network_id
LEFT JOIN campaigns c ON o.id = c.offer_id
GROUP BY n.id, n.name, n.status, n.last_sync_at, n.created_at;

COMMENT ON VIEW network_performance IS 'Performance metrics aggregated by affiliate network';

-- ============================================================================
-- PLATFORM PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW platform_performance AS
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(DISTINCT c.id) AS campaign_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') AS active_campaign_count,
    COALESCE(SUM(c.spend), 0) AS total_spend,
    COALESCE(SUM(c.revenue), 0) AS total_revenue,
    COALESCE(SUM(c.profit), 0) AS total_profit,
    COALESCE(SUM(c.impressions), 0) AS total_impressions,
    COALESCE(SUM(c.clicks), 0) AS total_clicks,
    COALESCE(SUM(c.conversions), 0) AS total_conversions,
    CASE 
        WHEN SUM(c.impressions) > 0 THEN SUM(c.clicks)::DECIMAL / SUM(c.impressions)::DECIMAL * 100
        ELSE 0 
    END AS avg_ctr,
    CASE 
        WHEN SUM(c.clicks) > 0 THEN SUM(c.spend) / SUM(c.clicks)
        ELSE 0 
    END AS avg_cpc,
    CASE 
        WHEN SUM(c.conversions) > 0 THEN SUM(c.spend) / SUM(c.conversions)
        ELSE 0 
    END AS avg_cpa,
    CASE 
        WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
        ELSE 0 
    END AS avg_roas,
    p.last_sync_at,
    p.created_at
FROM platforms p
LEFT JOIN campaigns c ON p.id = c.platform_id
GROUP BY p.id, p.name, p.status, p.last_sync_at, p.created_at;

COMMENT ON VIEW platform_performance IS 'Performance metrics aggregated by advertising platform';

-- ============================================================================
-- NICHE PERFORMANCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW niche_performance AS
SELECT 
    o.niche,
    COUNT(DISTINCT o.id) AS offer_count,
    COUNT(DISTINCT c.id) AS campaign_count,
    COALESCE(SUM(c.spend), 0) AS total_spend,
    COALESCE(SUM(c.revenue), 0) AS total_revenue,
    COALESCE(SUM(c.profit), 0) AS total_profit,
    COALESCE(SUM(c.conversions), 0) AS total_conversions,
    CASE 
        WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
        ELSE 0 
    END AS avg_roas,
    CASE 
        WHEN SUM(c.conversions) > 0 THEN SUM(c.spend) / SUM(c.conversions)
        ELSE 0 
    END AS avg_cpa,
    AVG(o.quality_score) AS avg_offer_quality_score,
    AVG(o.epc) AS avg_epc
FROM offers o
LEFT JOIN campaigns c ON o.id = c.offer_id
WHERE o.niche IS NOT NULL
GROUP BY o.niche
ORDER BY total_profit DESC;

COMMENT ON VIEW niche_performance IS 'Performance metrics aggregated by niche/category';

-- ============================================================================
-- RECENT CONVERSIONS VIEW (Last 100)
-- ============================================================================

CREATE OR REPLACE VIEW recent_conversions AS
SELECT 
    cv.id,
    cv.transaction_id,
    o.name AS offer_name,
    o.niche,
    c.name AS campaign_name,
    p.name AS platform_name,
    cv.commission_amount,
    cv.sale_amount,
    cv.status,
    cv.conversion_date,
    cv.approval_date,
    cl.country,
    cl.device
FROM conversions cv
LEFT JOIN offers o ON cv.offer_id = o.id
LEFT JOIN campaigns c ON cv.campaign_id = c.id
LEFT JOIN platforms p ON c.platform_id = p.id
LEFT JOIN clicks cl ON cv.click_id = cl.id
ORDER BY cv.conversion_date DESC
LIMIT 100;

COMMENT ON VIEW recent_conversions IS 'Most recent 100 conversions with related information';

-- ============================================================================
-- CAMPAIGN HEALTH STATUS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW campaign_health_status AS
SELECT 
    c.id,
    c.name,
    c.status,
    o.name AS offer_name,
    p.name AS platform_name,
    c.roas,
    c.cpa,
    c.spend,
    c.revenue,
    c.profit,
    c.conversions,
    c.budget_daily,
    CASE 
        WHEN c.status != 'active' THEN 'inactive'
        WHEN c.roas >= 3.0 THEN 'excellent'
        WHEN c.roas >= 2.5 THEN 'good'
        WHEN c.roas >= 2.0 THEN 'fair'
        WHEN c.roas >= 1.5 THEN 'poor'
        ELSE 'critical'
    END AS health_status,
    CASE 
        WHEN c.roas < 1.5 AND c.spend > 100 THEN 'Consider pausing'
        WHEN c.roas > 3.0 AND c.spend > 100 THEN 'Consider scaling'
        WHEN c.roas >= 2.0 AND c.roas < 3.0 THEN 'Optimize'
        ELSE 'Monitor'
    END AS recommendation,
    c.last_synced_at,
    c.created_at
FROM campaigns c
LEFT JOIN offers o ON c.offer_id = o.id
LEFT JOIN platforms p ON c.platform_id = p.id
WHERE c.status IN ('active', 'paused')
ORDER BY c.roas DESC;

COMMENT ON VIEW campaign_health_status IS 'Campaign health assessment with automated recommendations';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your setup)
-- ============================================================================

-- Grant SELECT on all views to application user
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_app_user;

