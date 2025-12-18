const express = require('express');
const router = express.Router();
const PersistentScraper = require('../services/persistent-scraper');
const logger = require('../config/logger');

/**
 * POST /api/scraper/:platform/scrape
 * 
 * Run scraper using saved session
 */
router.post('/:platform/scrape', async (req, res) => {
  const scraper = null;
  
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Replace with real auth

    logger.info(`[Scraper API] Starting scrape for platform: ${platform}, user: ${userId}`);

    // Create scraper instance
    const scraper = new PersistentScraper(userId, platform);

    // Initialize with saved session
    const initResult = await scraper.initialize();
    if (!initResult.success) {
      return res.json(initResult); // Returns needsReconnect: true
    }

    // Verify session is still valid
    const verifyResult = await scraper.verifySession(
      'https://app.hotmart.com/marketplace',
      /dashboard|marketplace|home/
    );

    if (!verifyResult.valid) {
      await scraper.close();
      return res.json(verifyResult); // Returns needsReconnect: true
    }

    // Run platform-specific scraper
    let result;
    if (platform === 'hotmart') {
      result = await scraper.scrapeHotmartMarketplace();
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    await scraper.close();

    res.json(result);
  } catch (error) {
    logger.error('[Scraper API] Error:', error);
    
    if (scraper) {
      await scraper.close();
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Scraping failed',
        details: error.message
      }
    });
  }
});

module.exports = router;
