const express = require('express');
const router = express.Router();
const hardenedScraper = require('../services/hardened-scraper');
const logger = require('../config/logger');

/**
 * POST /api/hardened-scraper/:platform/scrape
 * Trigger a scrape using hardened scraper with evidence collection
 */
router.post('/:platform/scrape', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Get from auth middleware

    logger.info(`[Hardened Scraper API] Scrape request for platform: ${platform}, user: ${userId}`);

    const result = await hardenedScraper.scrape(userId, platform);

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

module.exports = router;
