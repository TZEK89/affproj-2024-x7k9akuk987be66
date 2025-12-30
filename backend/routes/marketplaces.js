// backend/routes/marketplaces.js

const express = require('express');
const router = express.Router();
const MarketplaceService = require('../services/marketplace/MarketplaceService');
const { PLATFORM_PRESETS, SCRAPER_TYPES } = require('../services/marketplace/PlatformPresets');

// Get platform presets (must be before /:id route)
router.get('/config/presets', (req, res) => {
  res.json({ success: true, presets: PLATFORM_PRESETS });
});

// Get scraper types (must be before /:id route)
router.get('/config/scraper-types', (req, res) => {
  res.json({ success: true, types: SCRAPER_TYPES });
});

// Get all marketplaces for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const marketplaces = await MarketplaceService.getByUser(userId);
    res.json({ success: true, marketplaces });
  } catch (error) {
    console.error('Error fetching marketplaces:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single marketplace
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const marketplace = await MarketplaceService.getById(id);
    if (!marketplace || marketplace.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    res.json({ success: true, marketplace });
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create marketplace
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const {
      platform,
      name,
      base_url,
      language,
      category_filter,
      scraper_type,
      scraper_config,
      agent_id,
      max_products,
      icon_url
    } = req.body;

    // Validate required fields
    if (!platform || !name || !base_url) {
      return res.status(400).json({
        success: false,
        error: 'Platform, name, and base_url are required'
      });
    }

    // Validate URL
    try {
      new URL(base_url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }

    const marketplace = await MarketplaceService.create({
      user_id: userId,
      platform,
      name,
      base_url,
      language,
      category_filter,
      scraper_type: scraper_type || 'playwright',
      scraper_config: scraper_config || {},
      agent_id,
      max_products: max_products || 100,
      icon_url
    });

    res.status(201).json({ success: true, marketplace });
  } catch (error) {
    console.error('Error creating marketplace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update marketplace
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const existing = await MarketplaceService.getById(id);
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    const updated = await MarketplaceService.update(id, req.body);
    res.json({ success: true, marketplace: updated });
  } catch (error) {
    console.error('Error updating marketplace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete marketplace
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const existing = await MarketplaceService.getById(id);
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    await MarketplaceService.delete(id);
    res.json({ success: true, message: 'Marketplace deleted' });
  } catch (error) {
    console.error('Error deleting marketplace:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger scrape (placeholder - will be expanded in Block 3)
router.post('/:id/scrape', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const marketplace = await MarketplaceService.getById(id);
    if (!marketplace || marketplace.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    if (marketplace.status === 'scraping') {
      return res.status(400).json({ success: false, error: 'Scrape already in progress' });
    }

    // Create session
    const sessionId = await MarketplaceService.createSession({
      user_id: userId,
      marketplace_id: id,
      scraper_type: marketplace.scraper_type,
      agent_id: marketplace.agent_id,
      config_snapshot: {
        url: marketplace.base_url,
        max_products: marketplace.max_products,
        language: marketplace.language,
        category_filter: marketplace.category_filter
      }
    });

    // Update status
    await MarketplaceService.updateStatus(id, 'scraping');

    // TODO: Queue the actual scrape job (Block 3)
    res.json({
      success: true,
      sessionId,
      message: 'Scrape session created. Scraper implementation coming in Block 3.'
    });
  } catch (error) {
    console.error('Error triggering scrape:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get scrape status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const marketplace = await MarketplaceService.getById(id);
    if (!marketplace || marketplace.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    const latestSession = await MarketplaceService.getLatestSession(id);

    res.json({
      success: true,
      status: marketplace.status,
      lastScrapedAt: marketplace.last_scraped_at,
      productsCount: marketplace.products_count,
      errorMessage: marketplace.error_message,
      session: latestSession
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get products for a marketplace
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0, stage } = req.query;
    const userId = req.user?.id || 1;

    const marketplace = await MarketplaceService.getById(id);
    if (!marketplace || marketplace.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    const products = await MarketplaceService.getProducts(id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      stage
    });

    res.json({
      success: true,
      products,
      total: products.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel scrape
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const marketplace = await MarketplaceService.getById(id);
    if (!marketplace || marketplace.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Marketplace not found' });
    }

    if (marketplace.status !== 'scraping') {
      return res.status(400).json({ success: false, error: 'No scrape in progress' });
    }

    // Update marketplace status
    await MarketplaceService.updateStatus(id, 'ready');

    // Update latest session
    const latestSession = await MarketplaceService.getLatestSession(id);
    if (latestSession && latestSession.status === 'running') {
      await MarketplaceService.updateSession(latestSession.id, {
        status: 'cancelled',
        completed_at: new Date()
      });
    }

    res.json({ success: true, message: 'Scrape cancelled' });
  } catch (error) {
    console.error('Error cancelling scrape:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
