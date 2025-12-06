const express = require('express');
const router = express.Router();
const ImpactOfferSync = require('../jobs/syncImpactOffers');
const impactService = require('../services/impactService');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Store sync job status in memory (in production, use Redis or database)
let currentSyncJob = null;

/**
 * GET /api/integrations
 * Get overview of all available integrations and their status
 */
router.get('/', async (req, res) => {
  try {
    // Check configuration status for each integration
    const integrations = {
      hotmart: {
        name: 'Hotmart',
        description: 'Brazilian digital product marketplace',
        status: !!(process.env.HOTMART_CLIENT_ID && process.env.HOTMART_CLIENT_SECRET) ? 'configured' : 'not_configured',
        capabilities: ['product_sync', 'webhooks', 'affiliate_links'],
        docsUrl: 'https://developers.hotmart.com'
      },
      impact: {
        name: 'Impact.com',
        description: 'Global affiliate marketing platform',
        status: !!(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN) ? 'configured' : 'not_configured',
        capabilities: ['product_sync', 'catalog_search', 'conversion_tracking'],
        docsUrl: 'https://developer.impact.com'
      },
      clickbank: {
        name: 'ClickBank',
        description: 'Digital product affiliate network',
        status: 'coming_soon',
        capabilities: ['product_sync', 'marketplace_search'],
        docsUrl: 'https://api.clickbank.com'
      },
      shareasale: {
        name: 'ShareASale',
        description: 'Affiliate marketing network',
        status: 'coming_soon',
        capabilities: ['product_sync', 'merchant_search'],
        docsUrl: 'https://www.shareasale.com/api'
      }
    };

    // Get product counts for configured integrations
    const productCounts = await db.query(`
      SELECT network, COUNT(*) as count 
      FROM products 
      GROUP BY network
    `);

    // Add product counts to integrations
    for (const row of productCounts.rows) {
      if (integrations[row.network]) {
        integrations[row.network].productCount = parseInt(row.count);
      }
    }

    res.json({
      success: true,
      integrations,
      summary: {
        total: Object.keys(integrations).length,
        configured: Object.values(integrations).filter(i => i.status === 'configured').length,
        comingSoon: Object.values(integrations).filter(i => i.status === 'coming_soon').length
      }
    });
  } catch (error) {
    console.error('Error getting integrations overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get integrations overview' 
    });
  }
});

/**
 * GET /api/integrations/status
 * Get quick status of all integrations (authenticated)
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const statuses = {
      hotmart: {
        configured: !!(process.env.HOTMART_CLIENT_ID && process.env.HOTMART_CLIENT_SECRET),
        healthy: true // Would add real health check here
      },
      impact: {
        configured: !!(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN),
        healthy: true
      }
    };

    // Get last sync times
    const lastSyncs = await db.query(`
      SELECT network, MAX(updated_at) as last_sync
      FROM products
      WHERE network IN ('hotmart', 'impact')
      GROUP BY network
    `);

    for (const row of lastSyncs.rows) {
      if (statuses[row.network]) {
        statuses[row.network].lastSync = row.last_sync;
      }
    }

    res.json({
      success: true,
      statuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting integration statuses:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * GET /api/integrations/impact/status
 * Get Impact.com integration status
 */
router.get('/impact/status', authMiddleware, async (req, res) => {
  try {
    // Check if credentials are configured
    const isConfigured = !!(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN);

    // Get last sync info from database
    const lastSyncQuery = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        MAX(updated_at) as last_sync_time
      FROM products 
      WHERE network = 'impact'
    `);

    const stats = lastSyncQuery.rows[0];

    res.json({
      isConfigured,
      isConnected: isConfigured, // In a real app, you'd test the connection
      totalProducts: parseInt(stats.total_products) || 0,
      lastSyncTime: stats.last_sync_time,
      isSyncing: currentSyncJob !== null
    });
  } catch (error) {
    console.error('Error getting Impact.com status:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

/**
 * POST /api/integrations/impact/sync
 * Trigger a sync of offers from Impact.com
 */
router.post('/impact/sync', authMiddleware, async (req, res) => {
  try {
    // Check if a sync is already running
    if (currentSyncJob !== null) {
      return res.status(409).json({ 
        error: 'Sync already in progress',
        stats: currentSyncJob.getStats()
      });
    }

    // Get sync options from request body
    const options = {
      fullSync: req.body.fullSync !== false,
      campaignId: req.body.campaignId || null,
      maxProducts: req.body.maxProducts || null,
      inStockOnly: req.body.inStockOnly !== false
    };

    console.log('Starting Impact.com sync with options:', options);

    // Create a new sync job
    currentSyncJob = new ImpactOfferSync({
      db,
      impactService,
      onProgress: (stats) => {
        console.log('Sync progress:', stats);
      },
      onComplete: (stats) => {
        console.log('Sync complete:', stats);
        currentSyncJob = null;
      },
      onError: (error) => {
        console.error('Sync error:', error);
        currentSyncJob = null;
      }
    });

    // Start the sync
    currentSyncJob.start(options);

    res.json({ 
      message: 'Sync started',
      options
    });
  } catch (error) {
    console.error('Error starting Impact.com sync:', error);
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

/**
 * GET /api/integrations/impact/sync/status
 * Get current sync status
 */
router.get('/impact/sync/status', authMiddleware, async (req, res) => {
  try {
    if (currentSyncJob === null) {
      return res.json({ 
        isSyncing: false,
        message: 'No sync in progress'
      });
    }

    const stats = currentSyncJob.getStats();
    res.json({
      isSyncing: true,
      stats
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

/**
 * POST /api/integrations/impact/sync/cancel
 * Cancel current sync
 */
router.post('/impact/sync/cancel', authMiddleware, async (req, res) => {
  try {
    if (currentSyncJob === null) {
      return res.status(400).json({ error: 'No sync in progress' });
    }

    currentSyncJob.cancel();
    currentSyncJob = null;

    res.json({ message: 'Sync cancelled' });
  } catch (error) {
    console.error('Error cancelling sync:', error);
    res.status(500).json({ error: 'Failed to cancel sync' });
  }
});

/**
 * GET /api/integrations/impact/catalog
 * Search Impact.com catalog directly
 */
router.get('/impact/catalog', authMiddleware, async (req, res) => {
  try {
    const { query, page = 1, pageSize = 20 } = req.query;
    
    const results = await impactService.searchCatalog({
      query,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching Impact.com catalog:', error);
    res.status(500).json({ error: 'Failed to search catalog' });
  }
});

/**
 * GET /api/integrations/hotmart/status
 * Get Hotmart integration status
 */
router.get('/hotmart/status', authMiddleware, async (req, res) => {
  try {
    const isConfigured = !!(process.env.HOTMART_CLIENT_ID && process.env.HOTMART_CLIENT_SECRET);
    
    // Get product count
    const result = await db.query(`
      SELECT COUNT(*) as count FROM products WHERE network = 'hotmart'
    `);
    
    // Get conversion count
    const convResult = await db.query(`
      SELECT COUNT(*) as count FROM conversions WHERE network = 'hotmart'
    `);
    
    res.json({
      success: true,
      isConfigured,
      isConnected: isConfigured,
      webhookUrl: process.env.HOTMART_HOTTOK ? 'configured' : 'not_configured',
      stats: {
        products: parseInt(result.rows[0].count),
        conversions: parseInt(convResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error getting Hotmart status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
