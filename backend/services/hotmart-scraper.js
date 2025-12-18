const { chromium } = require('playwright');
const logger = require('../config/logger');

/**
 * Autonomous Hotmart Marketplace Scraper
 * 
 * This service runs a headless browser entirely in the backend.
 * No user interaction needed - AI agents have full control.
 */
class HotmartScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
    this.sessionCookies = null;
    
    // Credentials from environment
    this.email = process.env.HOTMART_EMAIL;
    this.password = process.env.HOTMART_PASSWORD;
    
    if (!this.email || !this.password) {
      logger.warn('Hotmart credentials not found in environment variables');
    }
  }

  /**
   * Initialize the headless browser
   */
  async initialize() {
    try {
      logger.info('[Hotmart Scraper] Initializing headless browser...');
      
      // Launch browser in headless mode
      this.browser = await chromium.launch({
        headless: true, // Run in background, no GUI
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      // Create browser context with stealth settings
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo'
      });

      // Create page
      this.page = await this.context.newPage();
      
      // Add stealth scripts
      await this.page.addInitScript(() => {
        // Override navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        
        // Override chrome property
        window.chrome = {
          runtime: {}
        };
        
        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });

      logger.info('[Hotmart Scraper] Browser initialized successfully');
      return true;
    } catch (error) {
      logger.error('[Hotmart Scraper] Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Login to Hotmart
   */
  async login() {
    try {
      if (!this.page) {
        await this.initialize();
      }

      logger.info('[Hotmart Scraper] Starting login process...');
      
      // Navigate to Hotmart login page
      await this.page.goto('https://app.hotmart.com/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      logger.info('[Hotmart Scraper] Login page loaded');

      // Wait for email input
      await this.page.waitForSelector('input[name="email"], input[type="email"]', {
        timeout: 10000
      });

      // Fill in credentials
      await this.page.fill('input[name="email"], input[type="email"]', this.email);
      await this.page.waitForTimeout(1000); // Human-like delay

      await this.page.fill('input[name="password"], input[type="password"]', this.password);
      await this.page.waitForTimeout(1000);

      logger.info('[Hotmart Scraper] Credentials entered, submitting...');

      // Click login button
      await this.page.click('button[type="submit"]');

      // Wait for navigation
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });

      // Check if login was successful
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
        logger.info('[Hotmart Scraper] Login successful!');
        this.isLoggedIn = true;
        
        // Save session cookies
        this.sessionCookies = await this.context.cookies();
        
        return {
          success: true,
          message: 'Login successful',
          url: currentUrl
        };
      } else if (currentUrl.includes('2fa') || currentUrl.includes('two-factor')) {
        logger.warn('[Hotmart Scraper] 2FA required');
        return {
          success: false,
          needs2FA: true,
          message: '2FA required - manual intervention needed',
          url: currentUrl
        };
      } else {
        logger.error('[Hotmart Scraper] Login failed - unexpected URL:', currentUrl);
        return {
          success: false,
          message: 'Login failed - unexpected redirect',
          url: currentUrl
        };
      }
    } catch (error) {
      logger.error('[Hotmart Scraper] Login error:', error);
      throw error;
    }
  }

  /**
   * Navigate to marketplace
   */
  async navigateToMarketplace() {
    try {
      if (!this.isLoggedIn) {
        throw new Error('Not logged in. Please login first.');
      }

      logger.info('[Hotmart Scraper] Navigating to marketplace...');
      
      // Navigate to marketplace URL
      await this.page.goto('https://app.hotmart.com/marketplace', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      logger.info('[Hotmart Scraper] Marketplace loaded');
      
      return {
        success: true,
        url: this.page.url()
      };
    } catch (error) {
      logger.error('[Hotmart Scraper] Failed to navigate to marketplace:', error);
      throw error;
    }
  }

  /**
   * Scrape all products from marketplace
   */
  async scrapeAllProducts() {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      await this.navigateToMarketplace();

      logger.info('[Hotmart Scraper] Starting product scraping...');
      
      const allProducts = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        logger.info(`[Hotmart Scraper] Scraping page ${currentPage}...`);
        
        // Wait for product cards to load
        await this.page.waitForSelector('[data-testid="product-card"], .product-card, .marketplace-product', {
          timeout: 10000
        }).catch(() => {
          logger.warn('[Hotmart Scraper] Product cards not found with standard selectors');
        });

        // Extract products from current page
        const pageProducts = await this.page.evaluate(() => {
          const products = [];
          
          // Try multiple selectors to find product cards
          const productCards = document.querySelectorAll('[data-testid="product-card"], .product-card, .marketplace-product, [class*="product"]');
          
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
              
              // Only add if we got at least a name
              if (product.name) {
                products.push(product);
              }
            } catch (err) {
              console.error('Error extracting product:', err);
            }
          });
          
          return products;
        });

        logger.info(`[Hotmart Scraper] Found ${pageProducts.length} products on page ${currentPage}`);
        allProducts.push(...pageProducts);

        // Check if there's a next page
        const nextButton = await this.page.$('[data-testid="next-page"], .next-page, button:has-text("Próximo"), button:has-text("Next")');
        
        if (nextButton) {
          const isDisabled = await nextButton.isDisabled();
          if (!isDisabled) {
            await nextButton.click();
            await this.page.waitForLoadState('networkidle');
            await this.page.waitForTimeout(2000); // Human-like delay
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }

        // Safety limit
        if (currentPage > 100) {
          logger.warn('[Hotmart Scraper] Reached page limit (100)');
          hasMorePages = false;
        }
      }

      logger.info(`[Hotmart Scraper] Scraping complete! Total products: ${allProducts.length}`);
      
      return {
        success: true,
        products: allProducts,
        totalPages: currentPage,
        totalProducts: allProducts.length
      };
    } catch (error) {
      logger.error('[Hotmart Scraper] Scraping error:', error);
      throw error;
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
      this.isLoggedIn = false;
      
      logger.info('[Hotmart Scraper] Browser closed');
    } catch (error) {
      logger.error('[Hotmart Scraper] Error closing browser:', error);
    }
  }

  /**
   * Get current session status
   */
  getStatus() {
    return {
      isInitialized: !!this.browser,
      isLoggedIn: this.isLoggedIn,
      hasCookies: !!this.sessionCookies
    };
  }
}

module.exports = HotmartScraper;
