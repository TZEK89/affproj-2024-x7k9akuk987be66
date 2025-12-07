/**
 * HotmartAutomation - Browser automation for Hotmart marketplace
 * Phase 2: Core browser automation functionality
 */

const { chromium } = require('playwright');

class HotmartAutomation {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      slowMo: options.slowMo || 0,
      timeout: options.timeout || 30000,
      ...options
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * Initialize the browser instance
   */
  async init() {
    console.log('[HotmartAutomation] Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    // Create context with realistic browser settings
    // NOTE: Do NOT pass geolocation: null - only include if actually defined
    const contextOptions = {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
    };

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    
    // Set default timeout
    this.page.setDefaultTimeout(this.options.timeout);
    
    console.log('[HotmartAutomation] Browser initialized successfully');
    return this;
  }

  /**
   * Login to Hotmart
   */
  async login(email, password) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Logging in to Hotmart...');

    try {
      // Navigate to Hotmart login page
      await this.page.goto('https://app.hotmart.com/login', {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for login form (actual Hotmart selector)
      await this.page.waitForSelector('#username', {
        timeout: 10000
      });

      // Fill email (actual Hotmart selector: #username)
      const emailInput = await this.page.$('#username');
      if (emailInput) {
        await emailInput.fill(email);
      } else {
        throw new Error('Email input not found');
      }

      // Fill password (actual Hotmart selector: #password)
      const passwordInput = await this.page.$('#password');
      if (passwordInput) {
        await passwordInput.fill(password);
      } else {
        throw new Error('Password input not found');
      }

      // Click login button (actual Hotmart selector: form#fm1 button containing "Log in")
      const loginButton = await this.page.$('form#fm1 button:has-text("Log in")');
      if (loginButton) {
        await loginButton.click();
      } else {
        throw new Error('Login button not found');
      }

      // Wait for navigation after login
      await this.page.waitForNavigation({
        waitUntil: 'networkidle',
        timeout: 30000
      }).catch(() => {
        // Navigation might not trigger if already on dashboard
      });

      // Wait a bit for any redirects
      await this.page.waitForTimeout(3000);

      // Check for 2FA verification page
      const currentUrl = this.page.url();
      if (currentUrl.includes('verify') || currentUrl.includes('2fa') || currentUrl.includes('mfa')) {
        console.log('[HotmartAutomation] 2FA verification detected');
        console.log('[HotmartAutomation] ⚠️  Please complete 2FA verification manually in the browser');
        console.log('[HotmartAutomation] Waiting for 2FA completion (60 seconds)...');
        
        // Wait for user to complete 2FA
        await this.page.waitForNavigation({
          waitUntil: 'networkidle',
          timeout: 60000
        }).catch(() => {
          throw new Error('2FA verification timeout - please complete 2FA within 60 seconds');
        });
        
        console.log('[HotmartAutomation] 2FA completed, continuing...');
      }

      // Check if login was successful by looking for dashboard elements
      const finalUrl = this.page.url();
      if (finalUrl.includes('login') || finalUrl.includes('signin')) {
        // Check for error messages
        const errorMessage = await this.page.$('.error-message, .alert-error, [class*="error"]');
        if (errorMessage) {
          const errorText = await errorMessage.textContent();
          throw new Error(`Login failed: ${errorText}`);
        }
        throw new Error('Login failed: Still on login page');
      }

      this.isLoggedIn = true;
      console.log('[HotmartAutomation] Login successful');
      
      return {
        success: true,
        url: finalUrl
      };

    } catch (error) {
      console.error('[HotmartAutomation] Login error:', error.message);
      throw error;
    }
  }

  /**
   * Navigate to the Hotmart marketplace
   */
  async navigateToMarketplace() {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Navigating to marketplace...');

    try {
      // Direct navigation to marketplace
      await this.page.goto('https://app.hotmart.com/market', {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for marketplace content to load
      await this.page.waitForSelector('[class*="product"], [class*="card"], [data-testid*="product"]', {
        timeout: 15000
      }).catch(() => {
        console.log('[HotmartAutomation] Product cards not immediately visible, continuing...');
      });

      console.log('[HotmartAutomation] At marketplace');
      return {
        success: true,
        url: this.page.url()
      };

    } catch (error) {
      console.error('[HotmartAutomation] Navigation error:', error.message);
      throw error;
    }
  }

  /**
   * Search for products in the marketplace
   */
  async searchMarketplace(keywords, filters = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Searching for: "${keywords}"`);

    try {
      // Look for search input
      const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], [class*="search"] input');
      
      if (searchInput) {
        await searchInput.fill('');
        await searchInput.fill(keywords);
        await this.page.keyboard.press('Enter');
      } else {
        // Try URL-based search
        const searchUrl = `https://app.hotmart.com/market?q=${encodeURIComponent(keywords)}`;
        await this.page.goto(searchUrl, {
          waitUntil: 'networkidle',
          timeout: this.options.timeout
        });
      }

      // Wait for results to load
      await this.page.waitForTimeout(3000);

      // Apply filters if provided
      if (filters.language) {
        await this.applyLanguageFilter(filters.language);
      }

      if (filters.sortBy) {
        await this.applySortFilter(filters.sortBy);
      }

      console.log('[HotmartAutomation] Search completed');
      return {
        success: true,
        keywords,
        filters,
        url: this.page.url()
      };

    } catch (error) {
      console.error('[HotmartAutomation] Search error:', error.message);
      throw error;
    }
  }

  /**
   * Apply language filter
   */
  async applyLanguageFilter(language) {
    console.log(`[HotmartAutomation] Applying language filter: ${language}`);
    
    try {
      // Look for language filter dropdown or checkbox
      const languageFilter = await this.page.$(`[data-filter="language"], [class*="language-filter"], button:has-text("${language}")`);
      if (languageFilter) {
        await languageFilter.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('[HotmartAutomation] Language filter not found or not applicable');
    }
  }

  /**
   * Apply sort filter
   */
  async applySortFilter(sortBy) {
    console.log(`[HotmartAutomation] Applying sort: ${sortBy}`);
    
    try {
      // Look for sort dropdown
      const sortDropdown = await this.page.$('[class*="sort"], [data-sort], select[class*="order"]');
      if (sortDropdown) {
        await sortDropdown.click();
        await this.page.waitForTimeout(500);
        
        // Select sort option
        const sortOption = await this.page.$(`[data-value="${sortBy}"], option[value="${sortBy}"], li:has-text("${sortBy}")`);
        if (sortOption) {
          await sortOption.click();
          await this.page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      console.log('[HotmartAutomation] Sort filter not found or not applicable');
    }
  }

  /**
   * Extract product cards from current page
   */
  async extractProductCards(maxProducts = 10) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Extracting up to ${maxProducts} products...`);

    try {
      // Wait for products to be visible
      await this.page.waitForSelector('[class*="product"], [class*="card"], [data-testid*="product"], article', {
        timeout: 10000
      }).catch(() => {
        console.log('[HotmartAutomation] No standard product containers found, trying alternative selectors...');
      });

      // Try multiple selectors for product cards
      const productSelectors = [
        '[class*="ProductCard"]',
        '[class*="product-card"]',
        '[data-testid*="product"]',
        'article[class*="card"]',
        '[class*="marketplace"] [class*="card"]',
        'div[class*="hot-product"]',
        '.product-item',
        '[class*="GridItem"]'
      ];

      let products = [];
      
      for (const selector of productSelectors) {
        const elements = await this.page.$$(selector);
        if (elements.length > 0) {
          console.log(`[HotmartAutomation] Found ${elements.length} products with selector: ${selector}`);
          
          for (let i = 0; i < Math.min(elements.length, maxProducts); i++) {
            try {
              const product = await this.extractProductData(elements[i]);
              if (product && product.name) {
                products.push(product);
              }
            } catch (e) {
              console.log(`[HotmartAutomation] Error extracting product ${i}:`, e.message);
            }
          }
          
          if (products.length > 0) break;
        }
      }

      // If no products found with selectors, try generic approach
      if (products.length === 0) {
        console.log('[HotmartAutomation] Trying generic extraction...');
        products = await this.extractProductsGeneric(maxProducts);
      }

      console.log(`[HotmartAutomation] Extracted ${products.length} products`);
      return products;

    } catch (error) {
      console.error('[HotmartAutomation] Extraction error:', error.message);
      return [];
    }
  }

  /**
   * Extract data from a single product element
   */
  async extractProductData(element) {
    const product = {
      name: null,
      price: null,
      commission: null,
      category: null,
      rating: null,
      url: null,
      imageUrl: null
    };

    try {
      // Extract name
      const nameEl = await element.$('h2, h3, h4, [class*="title"], [class*="name"], [class*="Title"]');
      if (nameEl) {
        product.name = await nameEl.textContent();
        product.name = product.name?.trim();
      }

      // Extract price
      const priceEl = await element.$('[class*="price"], [class*="Price"], [class*="valor"]');
      if (priceEl) {
        product.price = await priceEl.textContent();
        product.price = product.price?.trim();
      }

      // Extract commission
      const commissionEl = await element.$('[class*="commission"], [class*="Commission"], [class*="comissao"]');
      if (commissionEl) {
        product.commission = await commissionEl.textContent();
        product.commission = product.commission?.trim();
      }

      // Extract category
      const categoryEl = await element.$('[class*="category"], [class*="Category"], [class*="categoria"]');
      if (categoryEl) {
        product.category = await categoryEl.textContent();
        product.category = product.category?.trim();
      }

      // Extract rating
      const ratingEl = await element.$('[class*="rating"], [class*="Rating"], [class*="star"]');
      if (ratingEl) {
        product.rating = await ratingEl.textContent();
        product.rating = product.rating?.trim();
      }

      // Extract URL
      const linkEl = await element.$('a[href*="product"], a[href*="hotmart"]');
      if (linkEl) {
        product.url = await linkEl.getAttribute('href');
      }

      // Extract image
      const imgEl = await element.$('img');
      if (imgEl) {
        product.imageUrl = await imgEl.getAttribute('src');
      }

    } catch (error) {
      console.log('[HotmartAutomation] Error extracting product data:', error.message);
    }

    return product;
  }

  /**
   * Generic product extraction fallback
   */
  async extractProductsGeneric(maxProducts) {
    const products = [];
    
    try {
      // Get all links that might be product links
      const links = await this.page.$$('a[href*="product"], a[href*="/market/"]');
      
      for (let i = 0; i < Math.min(links.length, maxProducts); i++) {
        const link = links[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (text && text.trim().length > 5) {
          products.push({
            name: text.trim().substring(0, 100),
            url: href,
            price: null,
            commission: null,
            category: null,
            rating: null,
            imageUrl: null
          });
        }
      }
    } catch (error) {
      console.log('[HotmartAutomation] Generic extraction error:', error.message);
    }

    return products;
  }

  /**
   * Get detailed information about a specific product
   */
  async getProductDetails(productUrl) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Getting details for: ${productUrl}`);

    try {
      await this.page.goto(productUrl, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for content to load
      await this.page.waitForTimeout(2000);

      const details = {
        name: null,
        description: null,
        price: null,
        commission: null,
        commissionPercent: null,
        salesPage: null,
        vendor: null,
        category: null,
        rating: null,
        totalSales: null,
        affiliateLink: null,
        url: productUrl
      };

      // Extract name
      const nameEl = await this.page.$('h1, [class*="product-title"], [class*="ProductTitle"]');
      if (nameEl) {
        details.name = (await nameEl.textContent())?.trim();
      }

      // Extract description
      const descEl = await this.page.$('[class*="description"], [class*="Description"], [class*="about"]');
      if (descEl) {
        details.description = (await descEl.textContent())?.trim().substring(0, 500);
      }

      // Extract price
      const priceEl = await this.page.$('[class*="price"], [class*="Price"]');
      if (priceEl) {
        details.price = (await priceEl.textContent())?.trim();
      }

      // Extract commission info
      const commissionEl = await this.page.$('[class*="commission"], [class*="Commission"]');
      if (commissionEl) {
        const commText = (await commissionEl.textContent())?.trim();
        details.commission = commText;
        // Try to extract percentage
        const percentMatch = commText?.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
          details.commissionPercent = parseFloat(percentMatch[1]);
        }
      }

      // Extract vendor/producer
      const vendorEl = await this.page.$('[class*="vendor"], [class*="Vendor"], [class*="producer"], [class*="Producer"]');
      if (vendorEl) {
        details.vendor = (await vendorEl.textContent())?.trim();
      }

      console.log('[HotmartAutomation] Product details extracted');
      return details;

    } catch (error) {
      console.error('[HotmartAutomation] Error getting product details:', error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(fullPage = false) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Taking screenshot...');
    
    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png'
    });

    return screenshot;
  }

  /**
   * Close the browser
   */
  async close() {
    console.log('[HotmartAutomation] Closing browser...');
    
    if (this.page) {
      await this.page.close().catch(() => {});
    }
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
    
    this.page = null;
    this.context = null;
    this.browser = null;
    this.isLoggedIn = false;
    
    console.log('[HotmartAutomation] Browser closed');
  }
}

module.exports = HotmartAutomation;
