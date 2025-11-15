import { Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { getCache, setCache } from '../../config/redis';
import { AuthRequest } from '../middleware/auth';

/**
 * Get dashboard overview
 * GET /api/analytics/dashboard
 */
export const getDashboardOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { days = 30 } = req.query;

    // Try cache
    const cacheKey = `analytics:dashboard:${days}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get overall metrics
    const metrics = await query(
      `SELECT 
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_campaigns,
        COUNT(DISTINCT o.id) as total_offers,
        COUNT(DISTINCT lp.id) as total_landing_pages,
        COALESCE(SUM(c.spend), 0) as total_spend,
        COALESCE(SUM(c.revenue), 0) as total_revenue,
        COALESCE(SUM(c.profit), 0) as total_profit,
        COALESCE(SUM(c.clicks), 0) as total_clicks,
        COALESCE(SUM(c.conversions), 0) as total_conversions,
        CASE 
          WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
          ELSE 0
        END as avg_roas
       FROM campaigns c
       LEFT JOIN offers o ON c.offer_id = o.id
       LEFT JOIN landing_pages lp ON c.landing_page_id = lp.id
       WHERE c.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    );

    // Get daily trend
    const trend = await query(
      `SELECT * FROM daily_summary
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`
    );

    // Get top performers
    const topCampaigns = await query(
      `SELECT * FROM campaign_performance
       WHERE status = 'active'
       ORDER BY roas DESC
       LIMIT 5`
    );

    const topOffers = await query(
      `SELECT * FROM offer_performance
       ORDER BY total_revenue DESC
       LIMIT 5`
    );

    const response = {
      success: true,
      data: {
        metrics: metrics.rows[0],
        trend: trend.rows,
        topCampaigns: topCampaigns.rows,
        topOffers: topOffers.rows,
      },
    };

    // Cache for 5 minutes
    await setCache(cacheKey, response, 300);

    return res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by platform
 * GET /api/analytics/revenue/by-platform
 */
export const getRevenueByPlatform = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(
      `SELECT 
        p.name as platform,
        p.slug,
        COUNT(DISTINCT c.id) as campaign_count,
        COALESCE(SUM(c.spend), 0) as total_spend,
        COALESCE(SUM(c.revenue), 0) as total_revenue,
        COALESCE(SUM(c.profit), 0) as total_profit,
        CASE 
          WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
          ELSE 0
        END as roas
       FROM platforms p
       LEFT JOIN campaigns c ON p.id = c.platform_id
       WHERE c.created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY p.id, p.name, p.slug
       ORDER BY total_revenue DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by niche
 * GET /api/analytics/revenue/by-niche
 */
export const getRevenueByNiche = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(
      `SELECT 
        o.niche,
        COUNT(DISTINCT c.id) as campaign_count,
        COUNT(DISTINCT o.id) as offer_count,
        COALESCE(SUM(c.spend), 0) as total_spend,
        COALESCE(SUM(c.revenue), 0) as total_revenue,
        COALESCE(SUM(c.profit), 0) as total_profit,
        CASE 
          WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
          ELSE 0
        END as roas
       FROM offers o
       LEFT JOIN campaigns c ON o.id = c.offer_id
       WHERE c.created_at >= CURRENT_DATE - INTERVAL '${days} days'
         AND o.niche IS NOT NULL
       GROUP BY o.niche
       ORDER BY total_revenue DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversion funnel analysis
 * GET /api/analytics/funnel
 */
export const getConversionFunnel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { campaign_id, days = 30 } = req.query;

    const conditions = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (campaign_id) {
      conditions.push(`cl.campaign_id = $${paramIndex++}`);
      params.push(campaign_id);
    }

    conditions.push(`cl.created_at >= CURRENT_DATE - INTERVAL '${days} days'`);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT 
        COUNT(DISTINCT cl.id) as total_clicks,
        COUNT(DISTINCT CASE WHEN cv.id IS NOT NULL THEN cl.id END) as clicks_with_conversion,
        COUNT(DISTINCT cv.id) as total_conversions,
        COUNT(DISTINCT CASE WHEN cv.status = 'approved' THEN cv.id END) as approved_conversions,
        COUNT(DISTINCT CASE WHEN cv.status = 'pending' THEN cv.id END) as pending_conversions,
        COUNT(DISTINCT CASE WHEN cv.status = 'rejected' THEN cv.id END) as rejected_conversions,
        CASE 
          WHEN COUNT(DISTINCT cl.id) > 0 
          THEN (COUNT(DISTINCT cv.id)::float / COUNT(DISTINCT cl.id)) * 100
          ELSE 0
        END as conversion_rate,
        CASE 
          WHEN COUNT(DISTINCT cv.id) > 0
          THEN (COUNT(DISTINCT CASE WHEN cv.status = 'approved' THEN cv.id END)::float / COUNT(DISTINCT cv.id)) * 100
          ELSE 0
        END as approval_rate
       FROM clicks cl
       LEFT JOIN conversions cv ON cl.id = cv.click_id
       ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get time-based performance analysis
 * GET /api/analytics/performance/by-time
 */
export const getPerformanceByTime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { grouping = 'day', days = 30 } = req.query;

    let dateFormat: string;
    switch (grouping) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
    }

    const result = await query(
      `SELECT 
        TO_CHAR(cl.created_at, '${dateFormat}') as period,
        COUNT(DISTINCT cl.id) as clicks,
        COUNT(DISTINCT cv.id) as conversions,
        COALESCE(SUM(CASE WHEN cv.status = 'approved' THEN cv.commission_amount END), 0) as revenue,
        CASE 
          WHEN COUNT(DISTINCT cl.id) > 0
          THEN (COUNT(DISTINCT cv.id)::float / COUNT(DISTINCT cl.id)) * 100
          ELSE 0
        END as conversion_rate
       FROM clicks cl
       LEFT JOIN conversions cv ON cl.id = cv.click_id
       WHERE cl.created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY period
       ORDER BY period DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cohort analysis
 * GET /api/analytics/cohorts
 */
export const getCohortAnalysis = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT 
        DATE_TRUNC('week', c.created_at) as cohort_week,
        COUNT(DISTINCT c.id) as campaigns_launched,
        AVG(c.roas) as avg_roas,
        SUM(c.revenue) as total_revenue,
        SUM(c.profit) as total_profit
       FROM campaigns c
       WHERE c.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
       GROUP BY cohort_week
       ORDER BY cohort_week DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign health alerts
 * GET /api/analytics/alerts
 */
export const getHealthAlerts = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT * FROM campaign_health_status
       WHERE health_status IN ('critical', 'poor')
         AND status = 'active'
       ORDER BY 
         CASE health_status
           WHEN 'critical' THEN 1
           WHEN 'poor' THEN 2
         END,
         roas ASC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

