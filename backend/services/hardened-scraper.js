const logger = require('../config/logger');
const { supabase } = require('../config/supabase');
const localConnectService = require('./local-connect-v2');
const HotmartConnector = require('../connectors/HotmartConnector');

/**
 * Hardened Scraper Service
 * 
 * Uses MarketplaceConnector abstraction with:
 * - Deterministic login verification
 * - Session fingerprinting
 * - Hard evidence collection
 * - Explicit reconnect semantics
 */

class HardenedScraper {
  /**
   * Scrape a platform
   */
  async scrape(userId, platform) {
    let connector = null;

    try {
      logger.info(`[Hardened Scraper] Starting scrape for ${platform}, user ${userId}`);

      // Load saved session
      const sessionData = await localConnectService.loadSession(userId, platform);
      
      if (!sessionData) {
        logger.warn('[Hardened Scraper] No active session found');
        return {
          success: false,
          needsReconnect: true,
          platform,
          reason: 'NO_SESSION',
          message: 'No active session. Please connect using the local connector.'
        };
      }

      const { storageState, fingerprint } = sessionData;

      // Create connector based on platform
      connector = this.getConnector(platform);

      // Launch browser with session and fingerprint
      await connector.createContextWithSession(storageState, fingerprint);

      // Navigate to marketplace
      await connector.goToMarketplace();

      // Verify we're still logged in (deterministic check)
      const loginCheck = await connector.verifyLogin();
      
      if (!loginCheck.isLoggedIn) {
        logger.warn('[Hardened Scraper] Login verification failed:', loginCheck);
        
        // Collect evidence
        const evidence = await this.collectEvidence(connector, loginCheck);
        
        // Mark session as needs reconnect
        await localConnectService.markSessionNeedsReconnect(userId, platform, loginCheck.reason, evidence);
        
        await connector.cleanup();
        
        return {
          success: false,
          needsReconnect: true,
          platform,
          reason: loginCheck.reason,
          message: 'Session expired or invalid. Please reconnect using the local connector.',
          evidence
        };
      }

      logger.info('[Hardened Scraper] Session valid, starting scrape');

      // Scrape products
      const allProducts = [];
      let currentPage = 1;
      const maxPages = 25;

      while (currentPage <= maxPages) {
        logger.info(`[Hardened Scraper] Scraping page ${currentPage}`);

        const products = await connector.extractProducts();
        allProducts.push(...products);

        const hasNextPage = await connector.paginate();
        if (!hasNextPage) {
          break;
        }

        currentPage++;
      }

      logger.info(`[Hardened Scraper] Scraped ${allProducts.length} products from ${currentPage} pages`);

      // Score products
      const scoredProducts = allProducts.map(p => connector.scoreProduct(p));

      // Save to database
      const savedCount = await this.saveProducts(userId, platform, scoredProducts);

      // Update session metadata
      await localConnectService.updateSessionMetadata(userId, platform, {
        lastUrl: connector.getCurrentUrl()
      });

      await connector.cleanup();

      logger.info(`[Hardened Scraper] Scrape complete: ${savedCount} products saved`);

      return {
        success: true,
        platform,
        totalScraped: allProducts.length,
        totalSaved: savedCount,
        totalPages: currentPage,
        message: `Successfully scraped ${savedCount} products from ${currentPage} pages`
      };

    } catch (error) {
      logger.error('[Hardened Scraper] Error:', error);
      
      // Collect evidence
      if (connector) {
        const evidence = await this.collectEvidence(connector, { error: error.message });
        await localConnectService.markSessionNeedsReconnect(userId, platform, 'SCRAPE_ERROR', evidence);
        await connector.cleanup();
      }

      return {
        success: false,
        needsReconnect: true,
        platform,
        reason: 'SCRAPE_ERROR',
        error: error.message
      };
    }
  }

  /**
   * Get connector for platform
   */
  getConnector(platform) {
    switch (platform) {
      case 'hotmart':
        return new HotmartConnector();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Collect hard evidence for debugging
   */
  async collectEvidence(connector, context) {
    const evidence = {
      timestamp: new Date().toISOString(),
      currentUrl: connector.getCurrentUrl(),
      cookieCount: await connector.getCookieCount(),
      ...context
    };

    // Take screenshot
    const screenshot = await connector.takeScreenshot();
    if (screenshot) {
      // TODO: Upload screenshot to S3 or similar
      // For now, just log that we have it
      evidence.hasScreenshot = true;
      evidence.screenshotSize = screenshot.length;
    }

    logger.info('[Hardened Scraper] Evidence collected:', evidence);

    return evidence;
  }

  /**
   * Save products to database
   */
  async saveProducts(userId, platform, products) {
    let savedCount = 0;

    for (const product of products) {
      try {
        const { error } = await supabase
          .from('products')
          .upsert({
            user_id: userId,
            network: platform,
            name: product.name,
            price: product.price,
            commission_rate: product.commission,
            gravity: product.temperature,
            profitability_score: product.profitability_score,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,network,name'
          });

        if (!error) {
          savedCount++;
        }
      } catch (error) {
        logger.error('[Hardened Scraper] Error saving product:', error);
      }
    }

    return savedCount;
  }
}

module.exports = new HardenedScraper();
