const express = require('express');
const router = express.Router();
const headlessScraper = require('../services/headless-scraper');
const logger = require('../config/logger');

/**
 * POST /api/headless-scraper/:platform/scrape
 * Run headless scraper using saved session
 */
router.post('/:platform/scrape', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Get from auth middleware

    logger.info(`[Headless Scraper API] Scrape request for platform: ${platform}, user: ${userId}`);

    if (platform !== 'hotmart') {
      return res.status(400).json({
        success: false,
        error: `Platform ${platform} not yet supported`
      });
    }

    const result = await headlessScraper.scrapeHotmart(userId);

    if (result.needsReconnect) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Headless Scraper API] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
