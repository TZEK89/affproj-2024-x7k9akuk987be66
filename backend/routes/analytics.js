const express = require('express');
const router = express.Router();
const { supabase } = require('../config/database');

// GET /api/analytics - Get analytics overview
router.get('/', async (req, res) => {
  try {
    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get active products
    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total campaigns
    const { count: totalCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true });

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get total landing pages
    const { count: totalLandingPages } = await supabase
      .from('landing_pages')
      .select('*', { count: 'exact', head: true });

    // Get total subscribers
    const { count: totalSubscribers } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    // Calculate totals from products
    const { data: products } = await supabase
      .from('products')
      .select('price, commission_rate');

    let totalRevenue = 0;
    let avgCommission = 0;

    if (products && products.length > 0) {
      const totalCommissionRate = products.reduce((sum, p) => {
        const price = parseFloat(p.price) || 0;
        const commissionRate = parseFloat(p.commission_rate) || 0;
        totalRevenue += price * (commissionRate / 100);
        return sum + commissionRate;
      }, 0);
      avgCommission = totalCommissionRate / products.length;
    }

    // Get campaign budgets
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('budget');

    const totalBudget = campaigns?.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0) || 0;

    // Get landing page views
    const { data: landingPages } = await supabase
      .from('landing_pages')
      .select('views, conversions');

    const totalViews = landingPages?.reduce((sum, lp) => sum + (parseInt(lp.views) || 0), 0) || 0;
    const totalConversions = landingPages?.reduce((sum, lp) => sum + (parseInt(lp.conversions) || 0), 0) || 0;
    const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts: totalProducts || 0,
          activeProducts: activeProducts || 0,
          totalCampaigns: totalCampaigns || 0,
          activeCampaigns: activeCampaigns || 0,
          totalLandingPages: totalLandingPages || 0,
          totalSubscribers: totalSubscribers || 0,
          totalRevenue: totalRevenue.toFixed(2),
          avgCommission: avgCommission.toFixed(2),
          totalBudget: totalBudget.toFixed(2),
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
