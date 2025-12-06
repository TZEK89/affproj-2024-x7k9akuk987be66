/**
 * Hotmart Marketplace Automation
 * Performs human-like research on Hotmart marketplace
 */

const BrowserService = require('./BrowserService');

class HotmartAutomation extends BrowserService {
  constructor() {
    super();
    this.baseUrl = 'https://app.hotmart.com';
    this.isLoggedIn = false;
  }

  /**
   * Login to Hotmart
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} - Success status
   */
  async login(email, password) {
    try {
      console.log('🔐 Attempting to login to Hotmart...');
      
      // Navigate to login page
      await this.goto(`${this.baseUrl}/login`);
      await this.wait(2000);

      // Check if already logged in
      const isAlreadyLoggedIn = await this.exists('[data-testid="user-menu"]');
      if (isAlreadyLoggedIn) {
        console.log('✅ Already logged in');
        this.isLoggedIn = true;
        return true;
      }

      // Fill login form
      await this.type('input[name="email"], input[type="email"]', email);
      await this.wait(500);
      await this.type('input[name="password"], input[type="password"]', password);
      await this.wait(500);

      // Click login button
      await this.click('button[type="submit"]');
      await this.wait(5000);

      // Verify login success
      const loginSuccess = await this.exists('[data-testid="user-menu"]') || 
                          await this.getUrl().includes('/dashboard') ||
                          await this.getUrl().includes('/market');

      if (loginSuccess) {
        console.log('✅ Login successful');
        this.isLoggedIn = true;
        return true;
      } else {
        console.log('❌ Login failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return false;
    }
  }

  /**
   * Navigate to marketplace
   * @returns {Promise<void>}
   */
  async goToMarketplace() {
    if (!this.isLoggedIn) {
      throw new Error('Must be logged in to access marketplace');
    }

    console.log('🏪 Navigating to marketplace...');
    await this.goto(`${this.baseUrl}/market/hot-products`);
    await this.wait(3000);
  }

  /**
   * Search for products in marketplace
   * @param {string} keywords - Search keywords
   * @param {Object} filters - Search filters
   * @returns {Promise<void>}
   */
  async searchMarketplace(keywords, filters = {}) {
    console.log(`🔍 Searching for: "${keywords}"`);
    
    // Find and use search input
    const searchInput = 'input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]';
    
    if (await this.exists(searchInput)) {
      await this.type(searchInput, keywords);
      await this.wait(1000);
      
      // Press Enter or click search button
      await this.page.keyboard.press('Enter');
      await this.wait(3000);
    } else {
      console.log('⚠️  Search input not found, using URL parameters');
      await this.goto(`${this.baseUrl}/market/hot-products?search=${encodeURIComponent(keywords)}`);
      await this.wait(3000);
    }

    // Apply filters if provided
    if (filters.language) {
      await this.applyLanguageFilter(filters.language);
    }

    if (filters.category) {
      await this.applyCategoryFilter(filters.category);
    }

    if (filters.sortBy) {
      await this.applySorting(filters.sortBy);
    }

    await this.wait(2000);
    console.log('✅ Search completed');
  }

  /**
   * Apply language filter
   * @param {string} language - Language code (e.g., 'pt', 'en', 'es')
   * @returns {Promise<void>}
   */
  async applyLanguageFilter(language) {
    try {
      console.log(`🌐 Applying language filter: ${language}`);
      
      // Look for language filter dropdown
      const languageFilter = 'select[name="language"], [data-filter="language"]';
      if (await this.exists(languageFilter)) {
        await this.page.selectOption(languageFilter, language);
        await this.wait(2000);
      }
    } catch (error) {
      console.log('⚠️  Could not apply language filter:', error.message);
    }
  }

  /**
   * Apply category filter
   * @param {string} category - Category name
   * @returns {Promise<void>}
   */
  async applyCategoryFilter(category) {
    try {
      console.log(`📂 Applying category filter: ${category}`);
      
      const categoryFilter = 'select[name="category"], [data-filter="category"]';
      if (await this.exists(categoryFilter)) {
        await this.page.selectOption(categoryFilter, category);
        await this.wait(2000);
      }
    } catch (error) {
      console.log('⚠️  Could not apply category filter:', error.message);
    }
  }

  /**
   * Apply sorting
   * @param {string} sortBy - Sort option (e.g., 'best_sellers', 'highest_commission')
   * @returns {Promise<void>}
   */
  async applySorting(sortBy) {
    try {
      console.log(`🔄 Applying sort: ${sortBy}`);
      
      const sortSelect = 'select[name="sort"], [data-filter="sort"]';
      if (await this.exists(sortSelect)) {
        await this.page.selectOption(sortSelect, sortBy);
        await this.wait(2000);
      }
    } catch (error) {
      console.log('⚠️  Could not apply sorting:', error.message);
    }
  }

  /**
   * Extract product cards from search results
   * @param {number} maxProducts - Maximum number of products to extract
   * @returns {Promise<Array>} - Array of product data
   */
  async extractProductCards(maxProducts = 10) {
    console.log(`📦 Extracting up to ${maxProducts} products...`);
    
    const products = [];
    
    try {
      // Wait for products to load
      await this.wait(3000);
      
      // Scroll to load more products
      await this.scrollToBottom();
      await this.wait(2000);

      // Extract product data using page.evaluate
      const extractedProducts = await this.evaluate((max) => {
        const productCards = Array.from(document.querySelectorAll('[data-product-card], .product-card, [class*="ProductCard"]'));
        
        return productCards.slice(0, max).map(card => {
          // Extract product name
          const nameEl = card.querySelector('h2, h3, [class*="title"], [class*="name"]');
          const name = nameEl ? nameEl.textContent.trim() : null;

          // Extract price
          const priceEl = card.querySelector('[class*="price"], [data-price]');
          const priceText = priceEl ? priceEl.textContent.trim() : null;
          const price = priceText ? parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.')) : null;

          // Extract commission
          const commissionEl = card.querySelector('[class*="commission"], [data-commission]');
          const commissionText = commissionEl ? commissionEl.textContent.trim() : null;
          const commission = commissionText ? parseFloat(commissionText.replace(/[^0-9.,]/g, '').replace(',', '.')) : null;

          // Extract product URL
          const linkEl = card.querySelector('a[href*="product"], a[href*="produto"]');
          const productUrl = linkEl ? linkEl.href : null;

          // Extract image
          const imgEl = card.querySelector('img');
          const imageUrl = imgEl ? (imgEl.src || imgEl.dataset.src) : null;

          // Extract category
          const categoryEl = card.querySelector('[class*="category"], [data-category]');
          const category = categoryEl ? categoryEl.textContent.trim() : null;

          // Extract rating if available
          const ratingEl = card.querySelector('[class*="rating"], [data-rating]');
          const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : null;

          return {
            name,
            price,
            commission,
            productUrl,
            imageUrl,
            category,
            rating,
            platform: 'hotmart'
          };
        }).filter(p => p.name); // Only return products with a name
      }, maxProducts);

      products.push(...extractedProducts);
      
      console.log(`✅ Extracted ${products.length} products`);
      return products;
    } catch (error) {
      console.error('❌ Error extracting products:', error.message);
      return products;
    }
  }

  /**
   * Get detailed product information
   * @param {string} productUrl - Product page URL
   * @returns {Promise<Object>} - Detailed product data
   */
  async getProductDetails(productUrl) {
    console.log(`📄 Getting product details from: ${productUrl}`);
    
    try {
      await this.goto(productUrl);
      await this.wait(3000);

      const details = await this.evaluate(() => {
        // Extract comprehensive product details
        const data = {
          name: null,
          description: null,
          price: null,
          commission: null,
          commissionType: null,
          category: null,
          language: null,
          salesPage: null,
          producer: null,
          rating: null,
          totalSales: null,
          guaranteeDays: null
        };

        // Product name
        const nameEl = document.querySelector('h1, [class*="ProductName"], [data-product-name]');
        if (nameEl) data.name = nameEl.textContent.trim();

        // Description
        const descEl = document.querySelector('[class*="description"], [data-description]');
        if (descEl) data.description = descEl.textContent.trim();

        // Price
        const priceEl = document.querySelector('[class*="price"], [data-price]');
        if (priceEl) {
          const priceText = priceEl.textContent.trim();
          data.price = parseFloat(priceText.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }

        // Commission
        const commEl = document.querySelector('[class*="commission"], [data-commission]');
        if (commEl) {
          const commText = commEl.textContent.trim();
          data.commission = parseFloat(commText.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }

        // Sales page link
        const salesPageEl = document.querySelector('a[href*="checkout"], a[class*="sales-page"]');
        if (salesPageEl) data.salesPage = salesPageEl.href;

        // Producer name
        const producerEl = document.querySelector('[class*="producer"], [data-producer]');
        if (producerEl) data.producer = producerEl.textContent.trim();

        return data;
      });

      console.log(`✅ Product details extracted: ${details.name}`);
      return details;
    } catch (error) {
      console.error('❌ Error getting product details:', error.message);
      return null;
    }
  }

  /**
   * Research a niche and return top products
   * @param {string} niche - Niche keywords
   * @param {Object} options - Research options
   * @returns {Promise<Array>} - Array of researched products
   */
  async researchNiche(niche, options = {}) {
    const {
      maxProducts = 10,
      language = null,
      sortBy = 'best_sellers',
      getDetails = false
    } = options;

    console.log(`🎯 Starting niche research: "${niche}"`);
    
    try {
      // Navigate to marketplace
      await this.goToMarketplace();

      // Search for niche
      await this.searchMarketplace(niche, { language, sortBy });

      // Extract product cards
      const products = await this.extractProductCards(maxProducts);

      // Get detailed info if requested
      if (getDetails && products.length > 0) {
        console.log('📊 Fetching detailed product information...');
        
        for (let i = 0; i < Math.min(products.length, 3); i++) {
          if (products[i].productUrl) {
            const details = await this.getProductDetails(products[i].productUrl);
            if (details) {
              products[i] = { ...products[i], ...details };
            }
            await this.wait(2000); // Be respectful with requests
          }
        }
      }

      console.log(`✅ Niche research completed: ${products.length} products found`);
      return products;
    } catch (error) {
      console.error('❌ Niche research error:', error.message);
      throw error;
    }
  }
}

module.exports = HotmartAutomation;
