const { chromium } = require('playwright');
const logger = require('../config/logger');
const { getPlatformConfig, verifyLogin } = require('../config/platforms');
const { applyFingerprint, getDefaultFingerprint } = require('../utils/session-fingerprint');

/**
 * Abstract Base Class: MarketplaceConnector
 * 
 * Provides a standardized interface for connecting to and scraping
 * affiliate marketplace platforms.
 * 
 * Subclasses must implement:
 * - extractProducts(page)
 * - scoreProduct(productData)
 */

class MarketplaceConnector {
  constructor(platform) {
    if (new.target === MarketplaceConnector) {
      throw new TypeError('Cannot construct MarketplaceConnector instances directly');
    }
    
    this.platform = platform;
    this.config = getPlatformConfig(platform);
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Create browser context with session and fingerprint
   */
  async createContextWithSession(storageState, fingerprint) {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    // Base context options
    let contextOptions = {
      storageState,
      viewport: { width: 1280, height: 720 }
    };

    // Apply fingerprint if available
    if (fingerprint) {
      contextOptions = applyFingerprint(contextOptions, fingerprint);
      logger.info(`[${this.platform}] Using fingerprint: ${fingerprint.userAgent}`);
    } else {
      // Use default fingerprint
      const defaultFingerprint = getDefaultFingerprint();
      contextOptions = applyFingerprint(contextOptions, defaultFingerprint);
      logger.warn(`[${this.platform}] No fingerprint provided, using default`);
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    return this.page;
  }

  /**
   * Verify login using deterministic auth check
   */
  async verifyLogin(page) {
    const result = await verifyLogin(page || this.page, this.platform);
    
    if (!result.isLoggedIn) {
      logger.warn(`[${this.platform}] Login verification failed:`, result);
    } else {
      logger.info(`[${this.platform}] Login verified successfully`);
    }
    
    return result;
  }

  /**
   * Navigate to marketplace
   */
  async goToMarketplace(page) {
    const targetPage = page || this.page;
    
    logger.info(`[${this.platform}] Navigating to marketplace: ${this.config.marketplace.url}`);
    
    await targetPage.goto(this.config.marketplace.url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for marketplace to be ready
    logger.info(`[${this.platform}] Waiting for: ${this.config.marketplace.readyDescription}`);
    
    await targetPage.waitForSelector(this.config.marketplace.readySelector, {
      timeout: 15000
    });

    logger.info(`[${this.platform}] Marketplace ready`);
  }

  /**
   * Extract products from current page
   * 
   * MUST be implemented by subclass
   */
  async extractProducts(page) {
    throw new Error('extractProducts() must be implemented by subclass');
  }

  /**
   * Score a product using profitability formula
   * 
   * MUST be implemented by subclass
   */
  scoreProduct(productData) {
    throw new Error('scoreProduct() must be implemented by subclass');
  }

  /**
   * Paginate through marketplace
   */
  async paginate(page) {
    const targetPage = page || this.page;
    
    try {
      // Check if next button exists and is enabled
      const hasNextPage = await targetPage.evaluate((config) => {
        const nextButton = document.querySelector(config.pagination.nextButton);
        return nextButton && 
               !nextButton.disabled && 
               !nextButton.classList.contains(config.pagination.disabledClass);
      }, this.config);

      if (!hasNextPage) {
        logger.info(`[${this.platform}] No more pages`);
        return false;
      }

      // Click next button
      await targetPage.click(this.config.pagination.nextButton);
      
      // Random delay 2-4 seconds
      const delay = 2000 + Math.random() * 2000;
      await targetPage.waitForTimeout(delay);

      // Wait for products to load
      await targetPage.waitForSelector(this.config.marketplace.readySelector, {
        timeout: 10000
      });

      return true;
    } catch (error) {
      logger.warn(`[${this.platform}] Pagination error:`, error.message);
      return false;
    }
  }

  /**
   * Get current page URL
   */
  getCurrentUrl() {
    return this.page ? this.page.url() : null;
  }

  /**
   * Take screenshot
   */
  async takeScreenshot() {
    if (!this.page) {
      return null;
    }

    try {
      return await this.page.screenshot({ fullPage: false });
    } catch (error) {
      logger.error(`[${this.platform}] Screenshot error:`, error);
      return null;
    }
  }

  /**
   * Get cookie count
   */
  async getCookieCount() {
    if (!this.context) {
      return 0;
    }

    try {
      const cookies = await this.context.cookies();
      return cookies.length;
    } catch (error) {
      logger.error(`[${this.platform}] Cookie count error:`, error);
      return 0;
    }
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

module.exports = MarketplaceConnector;
