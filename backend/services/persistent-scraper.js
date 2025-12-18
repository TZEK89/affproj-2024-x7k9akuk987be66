const { chromium } = require('playwright');
const logger = require('../config/logger');
const integrationConnectService = require('./integration-connect');
const { supabase } = require('../config/supabase');

/**
 * Persistent Scraper Service
 * 
 * Uses saved browser sessions for headless scraping.
 * If session is invalid, returns needsReconnect instead of attempting to bypass auth.
 */

class PersistentScraper {
  constructor(userId, platform) {
    this.userId = userId;
    this.platform = platform;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Initialize scraper with saved session
   */
  async initialize() {
    try {
      logger.info(`[Persistent Scraper] Initializing for user ${this.userId}, platform ${this.platform}`);

      // Load saved session
      const storageState = await integrationConnectService.loadSession(this.userId, this.platform);

      if (!storageState) {
        logger.warn(`[Persistent Scraper] No valid session found`);
        return {
          success: false,
          needsReconnect: true,
          message: 'No valid session found. Please connect first.'
        };
      }

      // Launch headless browser
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      // Create context with saved session
      this.context = await this.browser.newContext({
        storageState, // IMPORTANT: This loads cookies, localStorage, etc.
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      this.page = await this.context.newPage();

      // Add stealth scripts
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        window.chrome = { runtime: {} };
      });

      logger.info(`[Persistent Scraper] Initialized successfully with saved session`);

      return {
        success: true,
        message: 'Scraper initialized with saved session'
      };
    } catch (error) {
      logger.error('[Persistent Scraper] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Check if session is still valid
   */
  async verifySession(checkUrl, loginCheckPattern) {
    try {
      // Navigate to a protected page
      await this.page.goto(checkUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Add human-like delay
      await this.randomDelay(1000, 2000);

      const currentUrl = this.page.url();

      // Check if we got redirected to login
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        logger.warn(`[Persistent Scraper] Session invalid - redirected to login`);
        await integrationConnectService.markSessionNeedsReconnect(
          this.userId,
          this.platform,
          'Session expired - redirected to login page'
        );
        return {
          valid: false,
          needsReconnect: true,
          message: 'Session expired. Please reconnect.'
        };
      }

      // Check if URL matches expected pattern
      if (loginCheckPattern && !loginCheckPattern.test(currentUrl)) {
        logger.warn(`[Persistent Scraper] Session invalid - unexpected URL: ${currentUrl}`);
        await integrationConnectService.markSessionNeedsReconnect(
          this.userId,
          this.platform,
          `Unexpected URL: ${currentUrl}`
        );
        return {
          valid: false,
          needsReconnect: true,
          message: 'Session verification failed. Please reconnect.'
        };
      }

      logger.info(`[Persistent Scraper] Session verified successfully`);
      return {
        valid: true,
        message: 'Session is valid'
      };
    } catch (error) {
      logger.error('[Persistent Scraper] Session verification error:', error);
      await integrationConnectService.markSessionNeedsReconnect(
        this.userId,
        this.platform,
        error.message
      );
      return {
        valid: false,
        needsReconnect: true,
        message: 'Session verification failed',
        error: error.message
      };
    }
  }

  /**
   * Scrape Hotmart marketplace
   */
  async scrapeHotmartMarketplace() {
    try {
      logger.info(`[Persistent Scraper] Starting Hotmart marketplace scrape`);

      // Navigate to marketplace
      await this.page.goto('https://app.hotmart.com/marketplace', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await this.randomDelay(2000, 3000);

      const allProducts = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        logger.info(`[Persistent Scraper] Scraping page ${currentPage}...`);

        // Wait for products to load
        await this.page.waitForSelector('[data-testid="product-card"], .product-card, [class*="product"]', {
          timeout: 10000
        }).catch(() => {
          logger.warn('[Persistent Scraper] Product cards not found');
        });

        // Extract products
        const pageProducts = await this.page.evaluate(() => {
          const products = [];
          const productCards = document.querySelectorAll('[data-testid="product-card"], .product-card, [class*="product"]');

          productCards.forEach(card => {
            try {
              const product = {
                name: card.querySelector('[data-testid="product-name"], .product-name, h3, h4')?.textContent?.trim(),
                price: card.querySelector('[data-testid="product-price"], .product-price, [class*="price"]')?.textContent?.trim(),
                commission: card.querySelector('[data-testid="commission"], .commission, [class*="commission"]')?.textContent?.trim(),
                temperature: card.querySelector('[data-testid="temperature"], .temperature, [class*="temperature"]')?.textContent?.trim(),
                category: card.querySelector('[data-testid="category"], .category')?.textContent?.trim(),
                link: card.querySelector('a')?.href,
                image: card.querySelector('img')?.src
              };

              if (product.name) {
                products.push(product);
              }
            } catch (err) {
              console.error('Error extracting product:', err);
            }
          });

          return products;
        });

        logger.info(`[Persistent Scraper] Found ${pageProducts.length} products on page ${currentPage}`);
        allProducts.push(...pageProducts);

        // Check for next page
        const nextButton = await this.page.$('[data-testid="next-page"], .next-page, button:has-text("Próximo")');

        if (nextButton) {
          const isDisabled = await nextButton.isDisabled();
          if (!isDisabled) {
            await nextButton.click();
            await this.page.waitForLoadState('networkidle');
            await this.randomDelay(2000, 4000); // Human-like delay
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }

        // Safety limit
        if (currentPage > 100) {
          logger.warn('[Persistent Scraper] Reached page limit (100)');
          hasMorePages = false;
        }
      }

      // Save products to database
      const savedCount = await this.saveProducts(allProducts);

      logger.info(`[Persistent Scraper] Scrape complete! Total products: ${allProducts.length}, Saved: ${savedCount}`);

      return {
        success: true,
        totalScraped: allProducts.length,
        totalPages: currentPage,
        savedToDatabase: savedCount
      };
    } catch (error) {
      logger.error('[Persistent Scraper] Scraping error:', error);
      
      // Save error screenshot
      await this.saveErrorScreenshot(error);

      throw error;
    }
  }

  /**
   * Save products to database with profitability scoring
   */
  async saveProducts(products) {
    let savedCount = 0;

    for (const product of products) {
      try {
        // Parse price and commission
        const price = this.parsePrice(product.price);
        const commissionRate = this.parseCommission(product.commission);
        const temperature = this.parseTemperature(product.temperature);

        // Calculate profitability score
        // Formula: (Commission Amount × Temperature Score) / Price
        const commissionAmount = price * (commissionRate / 100);
        const profitabilityScore = temperature > 0 && price > 0
          ? (commissionAmount * temperature) / price
          : 0;

        // Save to database
        const { data, error } = await supabase
          .from('products')
          .upsert({
            name: product.name,
            price,
            currency: 'BRL',
            commission_rate: commissionRate,
            network: 'hotmart',
            category: product.category,
            product_url: product.link,
            image_url: product.image,
            metadata: {
              temperature,
              profitability_score: profitabilityScore
            },
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'network,network_id'
          });

        if (!error) {
          savedCount++;
        } else {
          logger.error('[Persistent Scraper] Error saving product:', error);
        }
      } catch (err) {
        logger.error('[Persistent Scraper] Error processing product:', err);
      }
    }

    return savedCount;
  }

  /**
   * Parse price from string
   */
  parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse commission rate from string
   */
  parseCommission(commissionStr) {
    if (!commissionStr) return 0;
    const cleaned = commissionStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse temperature score from string
   */
  parseTemperature(tempStr) {
    if (!tempStr) return 0;
    const cleaned = tempStr.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  }

  /**
   * Random delay for human-like behavior
   */
  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * Save error screenshot for debugging
   */
  async saveErrorScreenshot(error) {
    try {
      const screenshot = await this.page.screenshot({ fullPage: true });
      const currentUrl = this.page.url();

      // Save to Supabase storage (optional)
      // For now, just log the info
      logger.error('[Persistent Scraper] Error screenshot captured', {
        url: currentUrl,
        error: error.message
      });

      // Update integration_sessions with error info
      await supabase
        .from('integration_sessions')
        .update({
          last_error: error.message,
          last_url: currentUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .eq('platform', this.platform);
    } catch (err) {
      logger.error('[Persistent Scraper] Error saving screenshot:', err);
    }
  }

  /**
   * Close browser and cleanup
   */
  async close() {
    try {
      if (this.page) await this.page.close();
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();

      this.page = null;
      this.context = null;
      this.browser = null;

      logger.info('[Persistent Scraper] Browser closed');
    } catch (error) {
      logger.error('[Persistent Scraper] Error closing browser:', error);
    }
  }
}

module.exports = PersistentScraper;
