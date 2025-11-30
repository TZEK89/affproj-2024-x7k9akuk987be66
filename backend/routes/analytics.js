const express = require('express');
const router = express.Router();

// GET /api/analytics - Get analytics overview
router.get('/', async (req, res) => {
  try {
    // Get total and active products
    const productsResult = await req.db.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = $1) as active FROM products',
      [true]
    );

    // Get total and active campaigns
    const campaignsResult = await req.db.query(
      'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = $1) as active FROM campaigns',
      [true]
    );

    // Get total landing pages
    const landingPagesResult = await req.db.query(
      'SELECT COUNT(*) as total FROM landing_pages'
    );

    // Get total subscribers
    const subscribersResult = await req.db.query(
      'SELECT COUNT(*) as total FROM subscribers'
    );

    // Calculate revenue and commission from products
    const productsDataResult = await req.db.query(
      'SELECT price, commission_rate FROM products'
    );

    let totalRevenue = 0;
    let avgCommission = 0;

    if (productsDataResult.rows.length > 0) {
      const totalCommissionRate = productsDataResult.rows.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        const commissionRate = parseFloat(p.commission_rate) || 0;
        totalRevenue += price * (commissionRate / 100);
        return sum + commissionRate;
      }, 0);
      avgCommission = totalCommissionRate / productsDataResult.rows.length;
    }

    // Get campaign budgets
    const campaignBudgetResult = await req.db.query(
      'SELECT SUM(budget) as total FROM campaigns'
    );

    // Get landing page views and conversions
    const landingPageStatsResult = await req.db.query(
      'SELECT SUM(views) as total_views, SUM(conversions) as total_conversions FROM landing_pages'
    );

    const totalViews = parseInt(landingPageStatsResult.rows[0].total_views) || 0;
    const totalConversions = parseInt(landingPageStatsResult.rows[0].total_conversions) || 0;
    const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts: parseInt(productsResult.rows[0].total) || 0,
          activeProducts: parseInt(productsResult.rows[0].active) || 0,
          totalCampaigns: parseInt(campaignsResult.rows[0].total) || 0,
          activeCampaigns: parseInt(campaignsResult.rows[0].active) || 0,
          totalLandingPages: parseInt(landingPagesResult.rows[0].total) || 0,
          totalSubscribers: parseInt(subscribersResult.rows[0].total) || 0,
          totalRevenue: totalRevenue.toFixed(2),
          avgCommission: avgCommission.toFixed(2),
          totalBudget: parseFloat(campaignBudgetResult.rows[0].total || 0).toFixed(2),
          totalViews: totalViews,
          conversionRate: parseFloat(conversionRate)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch analytics data',
        details: error.message
      }
    });
  }
});

// POST /api/analytics/track - Track analytics event
router.post('/track', async (req, res) => {
  try {
    const {
      page_slug,
      event_type,
      event_data
    } = req.body;

    const user_agent = req.headers['user-agent'];
    const ip_address = req.ip || req.connection.remoteAddress;
    const referrer = req.headers['referer'] || req.headers['referrer'];

    const result = await req.db.query(
      `INSERT INTO analytics (
        page_slug, event_type, event_data, user_agent, ip_address, referrer
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [page_slug, event_type, event_data, user_agent, ip_address, referrer]
    );

    res.status(201).json({
      success: true,
      data: { id: result.rows[0].id },
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to track event', details: error.message }
    });
  }
});

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }

    // Total page views
    const pageViewsResult = await req.db.query(
      `SELECT COUNT(*) as total 
       FROM analytics 
       ${dateFilter} AND event_type = 'page_view'`,
      params
    );

    // Total clicks
    const clicksResult = await req.db.query(
      `SELECT COUNT(*) as total 
       FROM analytics 
       ${dateFilter} AND event_type = 'click'`,
      params
    );

    // Top pages
    const topPagesResult = await req.db.query(
      `SELECT page_slug, COUNT(*) as views
       FROM analytics
       ${dateFilter} AND event_type = 'page_view' AND page_slug IS NOT NULL
       GROUP BY page_slug
       ORDER BY views DESC
       LIMIT 10`,
      params
    );

    // Traffic sources
    const sourcesResult = await req.db.query(
      `SELECT 
         CASE 
           WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
           WHEN referrer LIKE '%google%' THEN 'Google'
           WHEN referrer LIKE '%facebook%' THEN 'Facebook'
           WHEN referrer LIKE '%twitter%' THEN 'Twitter'
           ELSE 'Other'
         END as source,
         COUNT(*) as visits
       FROM analytics
       ${dateFilter} AND event_type = 'page_view'
       GROUP BY source
       ORDER BY visits DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        page_views: parseInt(pageViewsResult.rows[0].total || 0),
        clicks: parseInt(clicksResult.rows[0].total || 0),
        top_pages: topPagesResult.rows,
        traffic_sources: sourcesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch analytics', details: error.message }
    });
  }
});

// GET /api/analytics/page/:slug - Get analytics for specific page
router.get('/page/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { start_date, end_date } = req.query;
    
    let dateFilter = 'WHERE page_slug = $1';
    const params = [slug];
    
    if (start_date && end_date) {
      dateFilter += ' AND created_at BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    const viewsResult = await req.db.query(
      `SELECT COUNT(*) as total 
       FROM analytics 
       ${dateFilter} AND event_type = 'page_view'`,
      params
    );

    const clicksResult = await req.db.query(
      `SELECT COUNT(*) as total 
       FROM analytics 
       ${dateFilter} AND event_type = 'click'`,
      params
    );

    const dailyViewsResult = await req.db.query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as views
       FROM analytics
       ${dateFilter} AND event_type = 'page_view'
       GROUP BY DATE(created_at)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    res.json({
      success: true,
      data: {
        slug,
        total_views: parseInt(viewsResult.rows[0].total || 0),
        total_clicks: parseInt(clicksResult.rows[0].total || 0),
        daily_views: dailyViewsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching page analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch page analytics', details: error.message }
    });
  }
});

module.exports = router;
