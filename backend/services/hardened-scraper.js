const logger = require('../config/logger');
const { supabase } = require('../config/supabase');
const localConnectService = require('./local-connect-v2');
const HotmartConnector = require('../connectors/HotmartConnector');
const aiProductScorer = require('./ai-product-scorer');

/**
 * Hardened Scraper Service
 * 
 * Uses MarketplaceConnector abstraction with:
 * - Deterministic login verification
 * - Session fingerprinting
 * - Hard evidence collection
 * - Explicit reconnect semantics
 * - AI-enhanced product scoring (V2)
 */

class HardenedScraper {
  constructor() {
    this.defaultOptions = {
      maxPages: 25,
      useAIScoring: true,
      parallelScoring: false,
      minScoreThreshold: 0 // Save all products, filter in UI
    };
  }

  /**
   * Scrape a platform with configurable options
   */
  async scrape(userId, platform, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    let connector = null;

    try {
      logger.info(`[Hardened Scraper] Starting scrape for ${platform}, user ${userId}`);
      logger.info(`[Hardened Scraper] Options: AI=${config.useAIScoring}, maxPages=${config.maxPages}`);

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

      while (currentPage <= config.maxPages) {
        logger.info(`[Hardened Scraper] Scraping page ${currentPage}/${config.maxPages}`);

        const products = await connector.extractProducts();
        allProducts.push(...products);

        const hasNextPage = await connector.paginate();
        if (!hasNextPage) {
          logger.info('[Hardened Scraper] No more pages available');
          break;
        }

        currentPage++;
      }

      logger.info(`[Hardened Scraper] Scraped ${allProducts.length} products from ${currentPage} pages`);

      // Score products (V1 or V2 AI-enhanced)
      let scoredProducts;
      
      if (config.useAIScoring) {
        logger.info('[Hardened Scraper] Using AI-enhanced scoring (V2)');
        scoredProducts = await connector.batchScoreProductsAI(allProducts, {
          useAI: true,
          parallel: config.parallelScoring
        });
      } else {
        logger.info('[Hardened Scraper] Using basic scoring (V1)');
        scoredProducts = allProducts.map(p => connector.scoreProduct(p));
      }

      // Filter by minimum score if configured
      const filteredProducts = config.minScoreThreshold > 0
        ? scoredProducts.filter(p => p.profitability_score >= config.minScoreThreshold)
        : scoredProducts;

      logger.info(`[Hardened Scraper] ${filteredProducts.length} products after filtering (min score: ${config.minScoreThreshold})`);

      // Save to database
      const savedCount = await this.saveProducts(userId, platform, filteredProducts);

      // Update session metadata
      await localConnectService.updateSessionMetadata(userId, platform, {
        lastUrl: connector.getCurrentUrl()
      });

      await connector.cleanup();

      // Get top products for summary
      const topProducts = connector.getTopProducts(filteredProducts, 5);

      logger.info(`[Hardened Scraper] Scrape complete: ${savedCount} products saved`);

      return {
        success: true,
        platform,
        totalScraped: allProducts.length,
        totalScored: scoredProducts.length,
        totalSaved: savedCount,
        totalPages: currentPage,
        scoringVersion: config.useAIScoring ? 'V2-AI' : 'V1',
        topProducts: topProducts.map(p => ({
          name: p.name,
          score: p.profitability_score,
          grade: p.ai_grade,
          price: p.price,
          commission: p.commission
        })),
        message: `Successfully scraped and scored ${savedCount} products from ${currentPage} pages`
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
   * Quick scrape with V1 scoring only (faster)
   */
  async quickScrape(userId, platform, maxPages = 5) {
    return this.scrape(userId, platform, {
      maxPages,
      useAIScoring: false
    });
  }

  /**
   * Deep scrape with full AI analysis (slower but more accurate)
   */
  async deepScrape(userId, platform, maxPages = 25) {
    return this.scrape(userId, platform, {
      maxPages,
      useAIScoring: true,
      parallelScoring: true
    });
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
   * Save products to database with enhanced schema
   */
  async saveProducts(userId, platform, products) {
    let savedCount = 0;

    for (const product of products) {
      try {
        const productData = {
          user_id: userId,
          network: platform,
          name: product.name,
          price: product.price,
          commission_rate: product.commission,
          gravity: product.temperature,
          profitability_score: product.profitability_score,
          ai_grade: product.ai_grade || null,
          score_version: product.score_version || 'V1',
          score_breakdown: product.score_breakdown ? JSON.stringify(product.score_breakdown) : null,
          category: product.category || null,
          product_url: product.productUrl || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('products')
          .upsert(productData, {
            onConflict: 'user_id,network,name'
          });

        if (!error) {
          savedCount++;
        } else {
          logger.warn('[Hardened Scraper] Upsert warning:', error.message);
        }
      } catch (error) {
        logger.error('[Hardened Scraper] Error saving product:', error);
      }
    }

    return savedCount;
  }

  /**
   * Re-score existing products with AI
   */
  async rescoreProducts(userId, platform, options = {}) {
    const { limit = 100, minAge = 24 } = options; // minAge in hours

    try {
      logger.info(`[Hardened Scraper] Re-scoring products for ${platform}, user ${userId}`);

      // Fetch products that need re-scoring
      const cutoffDate = new Date(Date.now() - minAge * 60 * 60 * 1000);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('network', platform)
        .or(`score_version.is.null,score_version.eq.V1,updated_at.lt.${cutoffDate.toISOString()}`)
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!products || products.length === 0) {
        return {
          success: true,
          message: 'No products need re-scoring',
          rescored: 0
        };
      }

      logger.info(`[Hardened Scraper] Found ${products.length} products to re-score`);

      // Convert to scoring format
      const productsToScore = products.map(p => ({
        name: p.name,
        price: p.price,
        commission: p.commission_rate,
        temperature: p.gravity,
        category: p.category || 'Digital Product'
      }));

      // Batch score with AI
      const scoredProducts = await aiProductScorer.batchScoreProducts(productsToScore, {
        useAI: true,
        parallel: false
      });

      // Update database
      let updatedCount = 0;
      for (let i = 0; i < scoredProducts.length; i++) {
        const scored = scoredProducts[i];
        const original = products[i];

        const { error: updateError } = await supabase
          .from('products')
          .update({
            profitability_score: scored.ai_score,
            ai_grade: scored.ai_grade,
            score_version: scored.score_version,
            score_breakdown: JSON.stringify(scored.score_breakdown),
            updated_at: new Date().toISOString()
          })
          .eq('id', original.id);

        if (!updateError) {
          updatedCount++;
        }
      }

      logger.info(`[Hardened Scraper] Re-scored ${updatedCount} products`);

      return {
        success: true,
        message: `Re-scored ${updatedCount} products with AI`,
        rescored: updatedCount,
        total: products.length
      };

    } catch (error) {
      logger.error('[Hardened Scraper] Re-score error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      defaultOptions: this.defaultOptions,
      supportedPlatforms: ['hotmart'],
      scoringStats: aiProductScorer.getStats()
    };
  }
}

module.exports = new HardenedScraper();
