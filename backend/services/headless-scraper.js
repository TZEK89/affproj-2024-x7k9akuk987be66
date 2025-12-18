const { chromium } = require('playwright');
const logger = require('../config/logger');
const { supabase } = require('../config/supabase');
const localConnectService = require('./local-connect');

/**
 * Headless Scraper Service
 * 
 * Uses saved sessions from Local Connect to scrape platforms headlessly.
 * Detects session expiry and prompts for reconnect.
 */

class HeadlessScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Scrape Hotmart marketplace
   */
  async scrapeHotmart(userId) {
    try {
      logger.info(`[Headless Scraper] Starting Hotmart scrape for user ${userId}`);

      // Load saved session
      const storageState = await localConnectService.loadSession(userId, 'hotmart');
      
      if (!storageState) {
        logger.warn('[Headless Scraper] No active session found');
        return {
          success: false,
          needsReconnect: true,
          message: 'No active session. Please connect using the local connector.'
        };
      }

      // Launch headless browser with session
      await this.launchWithSession(storageState);

      // Navigate to marketplace
      logger.info('[Headless Scraper] Navigating to Hotmart marketplace');
      await this.page.goto('https://app-vlc.hotmart.com/marketplace', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Verify we're still logged in
      const isLoggedIn = await this.verifyLogin();
      
      if (!isLoggedIn) {
        logger.warn('[Headless Scraper] Session expired - login required');
        await localConnectService.markSessionNeedsReconnect(userId, 'hotmart', 'Session expired');
        await this.cleanup();
        return {
          success: false,
          needsReconnect: true,
          message: 'Session expired. Please reconnect using the local connector.'
        };
      }

      logger.info('[Headless Scraper] Session valid, starting scrape');

      // Scrape products
      const products = await this.scrapeProducts();

      // Calculate profitability scores
      const scoredProducts = this.scoreProducts(products);

      // Save to database
      const savedCount = await this.saveProducts(userId, scoredProducts);

      // Update session last_url
      await this.updateSessionMetadata(userId, 'hotmart', this.page.url());

      await this.cleanup();

      logger.info(`[Headless Scraper] Scrape complete: ${savedCount} products saved`);

      return {
        success: true,
        totalScraped: products.length,
        totalSaved: savedCount,
        message: `Successfully scraped ${savedCount} products`
      };

    } catch (error) {
      logger.error('[Headless Scraper] Error:', error);
      
      // Save screenshot for debugging
      if (this.page) {
        try {
          const screenshot = await this.page.screenshot({ fullPage: false });
          const screenshotUrl = await this.uploadScreenshot(screenshot, userId, 'hotmart');
          await localConnectService.markSessionNeedsReconnect(userId, 'hotmart', error.message);
          
          // Update session with error details
          await supabase
            .from('integration_sessions')
            .update({
              last_error: error.message,
              last_screenshot_url: screenshotUrl,
              last_url: this.page.url()
            })
            .eq('user_id', userId)
            .eq('platform', 'hotmart');
        } catch (screenshotError) {
          logger.error('[Headless Scraper] Could not save screenshot:', screenshotError);
        }
      }

      await this.cleanup();

      return {
        success: false,
        needsReconnect: true,
        error: error.message
      };
    }
  }

  /**
   * Launch browser with saved session
   */
  async launchWithSession(storageState) {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.context = await this.browser.newContext({
      storageState, // Load saved session
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();
  }

  /**
   * Verify we're still logged in
   */
  async verifyLogin() {
    try {
      const currentUrl = this.page.url();
      
      // If redirected to login page, session expired
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        return false;
      }

      // Check for logged-in indicators
      const loggedInSelectors = [
        '.user-menu',
        '[data-testid="user-menu"]',
        '.dashboard',
        '.marketplace'
      ];

      for (const selector of loggedInSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          return true;
        } catch {
          // Continue to next selector
        }
      }

      // If no indicators found, assume logged in if not on login page
      return !currentUrl.includes('/login');
    } catch (error) {
      logger.error('[Headless Scraper] Login verification error:', error);
      return false;
    }
  }

  /**
   * Scrape products from marketplace
   */
  async scrapeProducts() {
    const products = [];
    let currentPage = 1;
    const maxPages = 25; // Limit to prevent infinite loops

    while (currentPage <= maxPages) {
      logger.info(`[Headless Scraper] Scraping page ${currentPage}`);

      // Wait for products to load
      await this.page.waitForSelector('.product-card, [data-testid="product"], .offer-item', { 
        timeout: 10000 
      });

      // Extract products from current page
      const pageProducts = await this.page.evaluate(() => {
        const productElements = document.querySelectorAll('.product-card, [data-testid="product"], .offer-item');
        const results = [];

        productElements.forEach(el => {
          try {
            const name = el.querySelector('h3, .product-name, .title')?.textContent?.trim();
            const priceText = el.querySelector('.price, .product-price')?.textContent?.trim();
            const commissionText = el.querySelector('.commission, .commission-rate')?.textContent?.trim();
            const temperatureText = el.querySelector('.temperature, .popularity, .gravity')?.textContent?.trim();

            if (name) {
              results.push({
                name,
                priceText,
                commissionText,
                temperatureText
              });
            }
          } catch (error) {
            // Skip invalid products
          }
        });

        return results;
      });

      products.push(...pageProducts);

      // Check if there's a next page
      const hasNextPage = await this.page.evaluate(() => {
        const nextButton = document.querySelector('.next-page, [aria-label="Next"], .pagination-next');
        return nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled');
      });

      if (!hasNextPage) {
        logger.info('[Headless Scraper] No more pages');
        break;
      }

      // Click next page
      await this.page.click('.next-page, [aria-label="Next"], .pagination-next');
      await this.page.waitForTimeout(2000 + Math.random() * 2000); // Random delay 2-4s

      currentPage++;
    }

    logger.info(`[Headless Scraper] Scraped ${products.length} products from ${currentPage} pages`);
    return products;
  }

  /**
   * Score products using profitability formula
   */
  scoreProducts(products) {
    return products.map(product => {
      try {
        // Parse price
        const price = this.parsePrice(product.priceText);
        
        // Parse commission (could be percentage or amount)
        const commission = this.parseCommission(product.commissionText, price);
        
        // Parse temperature/gravity (popularity metric)
        const temperature = this.parseTemperature(product.temperatureText);

        // Calculate profitability score
        // Formula: (Commission Amount × Temperature) / Price
        const profitabilityScore = price > 0 ? (commission * temperature) / price : 0;

        return {
          ...product,
          price,
          commission,
          temperature,
          profitability_score: Math.round(profitabilityScore * 100) / 100
        };
      } catch (error) {
        logger.error('[Headless Scraper] Error scoring product:', error);
        return {
          ...product,
          price: 0,
          commission: 0,
          temperature: 0,
          profitability_score: 0
        };
      }
    });
  }

  /**
   * Parse price from text
   */
  parsePrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Parse commission from text
   */
  parseCommission(commissionText, price) {
    if (!commissionText) return 0;
    
    // Check if it's a percentage
    if (commissionText.includes('%')) {
      const percentage = parseFloat(commissionText.replace(/[^\d.]/g, ''));
      return (price * percentage) / 100;
    }
    
    // Otherwise, assume it's an amount
    const match = commissionText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Parse temperature/gravity score
   */
  parseTemperature(temperatureText) {
    if (!temperatureText) return 1;
    const match = temperatureText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 1;
  }

  /**
   * Save products to database
   */
  async saveProducts(userId, products) {
    let savedCount = 0;

    for (const product of products) {
      try {
        const { error } = await supabase
          .from('products')
          .upsert({
            user_id: userId,
            network: 'hotmart',
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
        logger.error('[Headless Scraper] Error saving product:', error);
      }
    }

    return savedCount;
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(userId, platform, lastUrl) {
    try {
      await supabase
        .from('integration_sessions')
        .update({
          last_url: lastUrl,
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform);
    } catch (error) {
      logger.error('[Headless Scraper] Error updating session metadata:', error);
    }
  }

  /**
   * Upload screenshot for debugging
   */
  async uploadScreenshot(screenshot, userId, platform) {
    // TODO: Implement screenshot upload to S3 or similar
    // For now, just return a placeholder
    return `screenshot_${userId}_${platform}_${Date.now()}.png`;
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}

module.exports = new HeadlessScraper();
