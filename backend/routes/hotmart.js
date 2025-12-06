const express = require('express');
const router = express.Router();
const HotmartService = require('../services/hotmartService');
const HotmartSyncJob = require('../jobs/syncHotmartOffers');

// Store sync job instance
let currentSync = null;

/**
 * Test Hotmart API connection
 * GET /api/hotmart/test
 */
router.get('/test', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const result = await hotmart.testConnection();
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

/**
 * Get affiliate products (from commissions data)
 * GET /api/hotmart/affiliate-products
 */
router.get('/affiliate-products', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const products = await hotmart.getAffiliateProducts({
      maxResults: parseInt(req.query.limit) || 100
    });

    res.json({
      success: true,
      data: products,
      note: 'Products discovered from sales/commissions in last 90 days'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch affiliate products',
      error: error.message
    });
  }
});

/**
 * Start product sync
 * POST /api/hotmart/sync
 */
router.post('/sync', async (req, res) => {
  try {
    // Check if sync is already running
    if (currentSync) {
      return res.status(409).json({
        success: false,
        message: 'Sync already in progress'
      });
    }

    // Start sync in background
    currentSync = new HotmartSyncJob();
    
    // Don't await - let it run in background
    currentSync.run(req.body).then(result => {
      console.log('Sync completed:', result);
      currentSync = null;
    }).catch(error => {
      console.error('Sync failed:', error);
      currentSync = null;
    });

    res.json({
      success: true,
      message: 'Sync started',
      status: 'running'
    });

  } catch (error) {
    currentSync = null;
    res.status(500).json({
      success: false,
      message: 'Failed to start sync',
      error: error.message
    });
  }
});

/**
 * Get sync status
 * GET /api/hotmart/sync/status
 */
router.get('/sync/status', (req, res) => {
  if (!currentSync) {
    return res.json({
      status: 'idle',
      message: 'No sync in progress'
    });
  }

  res.json({
    status: 'running',
    stats: currentSync.getStats()
  });
});

/**
 * Get Hotmart products (YOUR products as producer)
 * GET /api/hotmart/products
 */
router.get('/products', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const products = await hotmart.getProducts({
      maxResults: parseInt(req.query.limit) || 50,
      pageToken: req.query.pageToken
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * Get Hotmart product by ID
 * GET /api/hotmart/products/:id
 */
router.get('/products/:id', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const product = await hotmart.getProduct(req.params.id);

    res.json(product);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: 'Product not found',
      error: error.message
    });
  }
});

/**
 * Get commissions
 * GET /api/hotmart/commissions
 */
router.get('/commissions', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const commissions = await hotmart.getCommissions({
      startDate: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      endDate: req.query.end_date ? parseInt(req.query.end_date) : undefined,
      productId: req.query.product_id,
      role: req.query.role,
      status: req.query.status,
      maxResults: parseInt(req.query.limit) || 50,
      pageToken: req.query.pageToken
    });

    res.json(commissions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commissions',
      error: error.message
    });
  }
});

/**
 * Get sales summary
 * GET /api/hotmart/sales/summary
 */
router.get('/sales/summary', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const summary = await hotmart.getSalesSummary({
      startDate: req.query.start_date ? parseInt(req.query.start_date) : undefined,
      endDate: req.query.end_date ? parseInt(req.query.end_date) : undefined,
      productId: req.query.product_id
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales summary',
      error: error.message
    });
  }
});

/**
 * Get subscriptions
 * GET /api/hotmart/subscriptions
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const hotmart = new HotmartService();
    const subscriptions = await hotmart.getSubscriptions({
      subscriberCode: req.query.subscriber_code,
      productId: req.query.product_id,
      status: req.query.status,
      maxResults: parseInt(req.query.limit) || 50,
      pageToken: req.query.pageToken
    });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
});

module.exports = router;
