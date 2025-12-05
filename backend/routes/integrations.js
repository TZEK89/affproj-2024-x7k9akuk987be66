const express = require('express');
const router = express.Router();
const ImpactOfferSync = require('../jobs/syncImpactOffers');
const impactService = require('../services/impactService');
const db = require('../db');

// Store sync job status in memory (in production, use Redis or database)
let currentSyncJob = null;

/**
 * GET /api/integrations/impact/status
 * Get Impact.com integration status
 */
router.get('/impact/status', async (req, res) => {
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
router.post('/impact/sync', async (req, res) => {
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
      inStockOnly: req.body.inStockOnly !== false,
      requireImage: req.body.requireImage !== false,
      minPrice: req.body.minPrice || null,
      maxPrice: req.body.maxPrice || null,
      category: req.body.category || null,
      withPromotions: req.body.withPromotions || false
    };

    // Start sync job
    currentSyncJob = new ImpactOfferSync();

    // Run sync in background
    currentSyncJob.sync(options)
      .then(stats => {
        console.log('Sync completed:', stats);
        currentSyncJob = null;
      })
      .catch(error => {
        console.error('Sync failed:', error);
        currentSyncJob = null;
      });

    res.json({ 
      message: 'Sync started',
      options 
    });
  } catch (error) {
    console.error('Error starting sync:', error);
    currentSyncJob = null;
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

/**
 * GET /api/integrations/impact/sync/status
 * Get current sync job status
 */
router.get('/impact/sync/status', (req, res) => {
  if (!currentSyncJob) {
    return res.json({
      isSyncing: false,
      message: 'No sync in progress'
    });
  }

  res.json({
    isSyncing: true,
    stats: currentSyncJob.getStats()
  });
});

/**
 * GET /api/integrations/impact/catalogs
 * List available catalogs from Impact.com
 */
router.get('/impact/catalogs', async (req, res) => {
  try {
    const catalogs = await impactService.listCatalogs();
    res.json({ catalogs });
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    res.status(500).json({ error: 'Failed to fetch catalogs' });
  }
});

/**
 * GET /api/integrations/impact/test
 * Test Impact.com API connection
 */
router.get('/impact/test', async (req, res) => {
  try {
    const catalogs = await impactService.listCatalogs();
    res.json({
      success: true,
      message: 'Successfully connected to Impact.com',
      catalogCount: catalogs.length
    });
  } catch (error) {
    console.error('Error testing Impact.com connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Impact.com',
      message: error.message
    });
  }
});

/**
 * GET /api/integrations/hotmart/status
 * Get Hotmart integration status
 */
router.get('/hotmart/status', async (req, res) => {
  try {
    // Check if credentials are configured
    const isConfigured = !!(process.env.HOTMART_CLIENT_ID && process.env.HOTMART_CLIENT_SECRET);

    // Get last sync info from database
    const lastSyncQuery = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        MAX(updated_at) as last_sync_time
      FROM products 
      WHERE network = 'hotmart'
    `);

    const stats = lastSyncQuery.rows[0];

    res.json({
      isConfigured,
      isConnected: isConfigured,
      totalProducts: parseInt(stats.total_products) || 0,
      lastSyncTime: stats.last_sync_time
    });
  } catch (error) {
    console.error('Error getting Hotmart status:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

/**
 * GET /api/integrations/hotmart/test
 * Test Hotmart API connection
 */
router.get('/hotmart/test', async (req, res) => {
  try {
    // Check if credentials are configured
    if (!process.env.HOTMART_CLIENT_ID || !process.env.HOTMART_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        error: 'Hotmart credentials not configured',
        message: 'Please set HOTMART_CLIENT_ID and HOTMART_CLIENT_SECRET environment variables'
      });
    }

    // Test authentication by getting access token
    const axios = require('axios');
    const authString = Buffer.from(
      `${process.env.HOTMART_CLIENT_ID}:${process.env.HOTMART_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.post(
      'https://api-sec-vlc.hotmart.com/security/oauth/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (tokenResponse.data.access_token) {
      res.json({
        success: true,
        message: 'Successfully connected to Hotmart',
        authenticated: true
      });
    } else {
      throw new Error('No access token received');
    }
  } catch (error) {
    console.error('Error testing Hotmart connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Hotmart',
      message: error.response?.data?.error || error.message
    });
  }
});

/**
 * POST /api/integrations/hotmart/sync
 * Trigger a sync of products from Hotmart
 */
router.post('/hotmart/sync', async (req, res) => {
  try {
    const { generateImages = true, batchSize = 50 } = req.body;

    // Check if credentials are configured
    if (!process.env.HOTMART_CLIENT_ID || !process.env.HOTMART_CLIENT_SECRET) {
      return res.status(400).json({
        success: false,
        error: 'Hotmart credentials not configured'
      });
    }

    // TODO: Implement actual Hotmart sync logic
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Hotmart sync started (implementation pending)',
      productsAdded: 0,
      productsUpdated: 0
    });
  } catch (error) {
    console.error('Error syncing Hotmart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Hotmart products',
      message: error.message
    });
  }
});

/**
 * GET /api/integrations/stats
 * Get overall integration statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        network,
        COUNT(*) as product_count,
        COUNT(DISTINCT network_name) as program_count,
        MAX(updated_at) as last_updated
      FROM products
      GROUP BY network
    `);

    res.json({ stats: stats.rows });
  } catch (error) {
    console.error('Error getting integration stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
