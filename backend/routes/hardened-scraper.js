const express = require('express');
const router = express.Router();
const hardenedScraper = require('../services/hardened-scraper');
const aiProductScorer = require('../services/ai-product-scorer');
const logger = require('../config/logger');

/**
 * POST /api/hardened-scraper/:platform/scrape
 * Trigger a scrape using hardened scraper with AI scoring
 * 
 * Body options:
 * - maxPages: number (default: 25)
 * - useAIScoring: boolean (default: true)
 * - parallelScoring: boolean (default: false)
 * - minScoreThreshold: number (default: 0)
 */
router.post('/:platform/scrape', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Get from auth middleware
    const options = req.body || {};

    logger.info(`[Hardened Scraper API] Scrape request for platform: ${platform}, user: ${userId}`);
    logger.info(`[Hardened Scraper API] Options:`, options);

    const result = await hardenedScraper.scrape(userId, platform, options);

    if (!result.success && result.needsReconnect) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Hardened Scraper API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardened-scraper/:platform/quick-scrape
 * Quick scrape with V1 scoring only (faster)
 * 
 * Query params:
 * - maxPages: number (default: 5)
 */
router.post('/:platform/quick-scrape', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1;
    const maxPages = parseInt(req.query.maxPages) || 5;

    logger.info(`[Hardened Scraper API] Quick scrape for ${platform}, user ${userId}, maxPages: ${maxPages}`);

    const result = await hardenedScraper.quickScrape(userId, platform, maxPages);

    if (!result.success && result.needsReconnect) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Hardened Scraper API] Quick scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardened-scraper/:platform/deep-scrape
 * Deep scrape with full AI analysis (slower but more accurate)
 * 
 * Query params:
 * - maxPages: number (default: 25)
 */
router.post('/:platform/deep-scrape', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1;
    const maxPages = parseInt(req.query.maxPages) || 25;

    logger.info(`[Hardened Scraper API] Deep scrape for ${platform}, user ${userId}, maxPages: ${maxPages}`);

    const result = await hardenedScraper.deepScrape(userId, platform, maxPages);

    if (!result.success && result.needsReconnect) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Hardened Scraper API] Deep scrape error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardened-scraper/:platform/rescore
 * Re-score existing products with AI
 * 
 * Body options:
 * - limit: number (default: 100)
 * - minAge: number in hours (default: 24)
 */
router.post('/:platform/rescore', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1;
    const options = req.body || {};

    logger.info(`[Hardened Scraper API] Re-score request for ${platform}, user ${userId}`);

    const result = await hardenedScraper.rescoreProducts(userId, platform, options);

    res.json(result);
  } catch (error) {
    logger.error('[Hardened Scraper API] Re-score error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardened-scraper/score-product
 * Score a single product with AI (for testing)
 * 
 * Body:
 * - name: string
 * - price: number
 * - commission: number
 * - temperature: number
 * - category: string (optional)
 */
router.post('/score-product', async (req, res) => {
  try {
    const { name, price, commission, temperature, category } = req.body;

    if (!name || !price || !commission || !temperature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, price, commission, temperature'
      });
    }

    logger.info(`[Hardened Scraper API] Score product request: ${name}`);

    const product = {
      name,
      price: parseFloat(price),
      commission: parseFloat(commission),
      temperature: parseFloat(temperature),
      category: category || 'Digital Product'
    };

    const result = await aiProductScorer.scoreProductEnhanced(product);

    res.json({
      success: true,
      product,
      scoring: result
    });
  } catch (error) {
    logger.error('[Hardened Scraper API] Score product error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hardened-scraper/stats
 * Get scraper and scoring statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = hardenedScraper.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('[Hardened Scraper API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hardened-scraper/clear-cache
 * Clear the AI scoring cache
 */
router.post('/clear-cache', (req, res) => {
  try {
    aiProductScorer.clearCache();
    res.json({
      success: true,
      message: 'AI scoring cache cleared'
    });
  } catch (error) {
    logger.error('[Hardened Scraper API] Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
