const express = require('express');
const router = express.Router();
const HotmartScraper = require('../services/hotmart-scraper');
const supabase = require('../config/supabase');
const logger = require('../config/logger');

// Singleton scraper instance
let scraperInstance = null;

function getScraper() {
  if (!scraperInstance) {
    scraperInstance = new HotmartScraper();
  }
  return scraperInstance;
}

/**
 * POST /api/hotmart-autonomous/scrape
 * Start autonomous scraping of Hotmart marketplace
 */
router.post('/scrape', async (req, res) => {
  try {
    logger.info('[API] Starting autonomous Hotmart scraping...');
    
    const scraper = getScraper();
    
    // Login
    const loginResult = await scraper.login();
    
    if (!loginResult.success) {
      return res.status(401).json({
        success: false,
        error: loginResult.message,
        needs2FA: loginResult.needs2FA
      });
    }

    // Scrape all products
    const scrapeResult = await scraper.scrapeAllProducts();
    
    // Save products to database
    let savedCount = 0;
    let errorCount = 0;

    for (const product of scrapeResult.products) {
      try {
        // Parse price and commission
        const priceMatch = product.price?.match(/[\d,.]+/);
        const commissionMatch = product.commission?.match(/[\d,.]+/);
        
        const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
        const commissionRate = commissionMatch ? parseFloat(commissionMatch[0].replace(',', '.')) : 0;

        // Calculate profitability score
        const temperature = parseFloat(product.temperature) || 1;
        const commissionAmount = (price * commissionRate) / 100;
        const profitabilityScore = price > 0 ? (commissionAmount * temperature) / price : 0;

        // Insert or update product
        const { data, error } = await supabase
          .from('products')
          .upsert({
            name: product.name,
            description: product.name, // Will be enriched later
            price: price,
            currency: 'BRL',
            image_url: product.image,
            product_url: product.link,
            commission_rate: commissionRate,
            network: 'hotmart',
            network_name: 'Hotmart',
            category: product.category || 'Uncategorized',
            is_active: true,
            metadata: {
              temperature: temperature,
              profitability_score: profitabilityScore,
              scraped_at: new Date().toISOString()
            }
          }, {
            onConflict: 'product_url'
          });

        if (error) {
          logger.error('[API] Error saving product:', error);
          errorCount++;
        } else {
          savedCount++;
        }
      } catch (err) {
        logger.error('[API] Error processing product:', err);
        errorCount++;
      }
    }

    // Close browser
    await scraper.close();

    logger.info(`[API] Scraping complete. Saved: ${savedCount}, Errors: ${errorCount}`);

    res.json({
      success: true,
      totalScraped: scrapeResult.totalProducts,
      totalPages: scrapeResult.totalPages,
      savedToDatabase: savedCount,
      errors: errorCount,
      message: `Successfully scraped ${scrapeResult.totalProducts} products from ${scrapeResult.totalPages} pages`
    });

  } catch (error) {
    logger.error('[API] Autonomous scraping error:', error);
    
    // Cleanup on error
    if (scraperInstance) {
      await scraperInstance.close();
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hotmart-autonomous/status
 * Get scraper status
 */
router.get('/status', (req, res) => {
  try {
    const scraper = getScraper();
    const status = scraper.getStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hotmart-autonomous/test-login
 * Test login without scraping
 */
router.post('/test-login', async (req, res) => {
  try {
    logger.info('[API] Testing Hotmart login...');
    
    const scraper = getScraper();
    const loginResult = await scraper.login();
    
    await scraper.close();

    res.json({
      success: loginResult.success,
      message: loginResult.message,
      needs2FA: loginResult.needs2FA,
      url: loginResult.url
    });

  } catch (error) {
    logger.error('[API] Login test error:', error);
    
    if (scraperInstance) {
      await scraperInstance.close();
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
