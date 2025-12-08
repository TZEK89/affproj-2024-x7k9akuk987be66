/**
 * BrightData Service
 * Provides enterprise-grade web scraping via Bright Data APIs
 * 
 * Services:
 * - Web Unlocker: $1.50/1000 requests - bypasses anti-bot
 * - Scraping Browser: $8/GB - full browser control
 * - SERP API: $1.50/1000 requests - search results
 */

const axios = require('axios');

class BrightDataService {
  constructor() {
    // Load credentials from environment
    this.apiToken = process.env.BRIGHTDATA_API_TOKEN;
    this.accountId = process.env.BRIGHTDATA_ACCOUNT_ID || 'hl_7bcafcc8';
    this.webUnlockerZone = process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE || 'web_unlocker2';
    this.browserZone = process.env.BRIGHTDATA_BROWSER_ZONE || 'scraping_browser1';
    this.browserPassword = process.env.BRIGHTDATA_BROWSER_PASSWORD || 'jrrphmy0cocz';
    this.serpZone = process.env.BRIGHTDATA_SERP_ZONE || 'serp_api2';
    
    // Construct browser WSS URL
    this.browserWss = process.env.BRIGHTDATA_BROWSER_WSS || 
      `wss://brd-customer-${this.accountId}-zone-${this.browserZone}:${this.browserPassword}@brd.superproxy.io:9222`;
    
    this.baseUrl = 'https://api.brightdata.com';
    
    // Statistics tracking
    this.stats = {
      webUnlocker: { requests: 0, success: 0, failed: 0, totalCost: 0 },
      browser: { requests: 0, success: 0, failed: 0, totalCost: 0 },
      serp: { requests: 0, success: 0, failed: 0, totalCost: 0 }
    };
    
    this.initialized = false;
  }

  /**
   * Initialize service and validate credentials
   */
  async initialize() {
    console.log('[BrightData] Initializing service...');
    console.log('[BrightData] Account ID:', this.accountId);
    console.log('[BrightData] Web Unlocker Zone:', this.webUnlockerZone);
    console.log('[BrightData] Browser Zone:', this.browserZone);
    console.log('[BrightData] SERP Zone:', this.serpZone);
    console.log('[BrightData] API Token:', this.apiToken ? '✓ Set' : '✗ Missing');
    
    if (!this.apiToken) {
      console.error('[BrightData] ❌ API Token is missing!');
      return { success: false, error: 'BRIGHTDATA_API_TOKEN not configured' };
    }
    
    // Test the connection
    const testResult = await this.testConnection();
    
    if (testResult.success) {
      this.initialized = true;
      console.log('[BrightData] ✅ Service initialized successfully');
    } else {
      console.error('[BrightData] ❌ Initialization failed:', testResult.error);
    }
    
    return testResult;
  }

  /**
   * Test API connection with a simple request
   */
  async testConnection() {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/request`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        data: {
          zone: this.webUnlockerZone,
          url: 'https://geo.brdtest.com/welcome.txt?product=unlocker&method=api',
          format: 'raw'
        },
        timeout: 30000
      });
      
      return { 
        success: true, 
        message: 'Bright Data connection successful',
        testResponse: response.data?.substring?.(0, 100) || response.data
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  // ============================================
  // WEB UNLOCKER API
  // Cost: $1.50 per 1000 requests (CPM)
  // Best for: Simple page fetching with anti-bot bypass
  // ============================================

  /**
   * Fetch a URL using Web Unlocker API
   * @param {string} url - The URL to fetch
   * @param {object} options - Request options
   * @returns {Promise<object>} - Response with success status and data
   */
  async webUnlockerFetch(url, options = {}) {
    this.stats.webUnlocker.requests++;
    
    const requestData = {
      zone: this.webUnlockerZone,
      url: url,
      format: options.format || 'raw', // 'raw', 'json', 'markdown'
      country: options.country || 'us'
    };
    
    // Add optional parameters
    if (options.renderJs !== undefined) {
      requestData.render_js = options.renderJs;
    }
    if (options.waitForSelector) {
      requestData.wait_for_selector = options.waitForSelector;
    }
    
    try {
      console.log(`[BrightData] Web Unlocker fetching: ${url}`);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/request`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        data: requestData,
        timeout: options.timeout || 60000
      });
      
      this.stats.webUnlocker.success++;
      this.stats.webUnlocker.totalCost += 0.0015; // $1.50/1000
      
      console.log(`[BrightData] ✅ Web Unlocker success for: ${url}`);
      
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        service: 'webUnlocker',
        cost: '$0.0015'
      };
    } catch (error) {
      this.stats.webUnlocker.failed++;
      
      console.error(`[BrightData] ❌ Web Unlocker failed for: ${url}`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
        service: 'webUnlocker'
      };
    }
  }

  /**
   * Fetch URL and return as clean markdown
   */
  async fetchAsMarkdown(url, options = {}) {
    return this.webUnlockerFetch(url, { ...options, format: 'markdown' });
  }

  /**
   * Fetch URL and return raw HTML
   */
  async fetchAsHtml(url, options = {}) {
    return this.webUnlockerFetch(url, { ...options, format: 'raw' });
  }

  // ============================================
  // SERP API
  // Cost: $1.50 per 1000 requests (CPM)
  // Best for: Search engine results (Google, Bing, etc.)
  // ============================================

  /**
   * Search using SERP API
   * @param {string} query - Search query
   * @param {object} options - Search options
   */
  async search(query, options = {}) {
    this.stats.serp.requests++;
    
    const engine = options.engine || 'google';
    const numResults = options.numResults || 10;
    
    // Build search URL based on engine
    let searchUrl;
    switch (engine) {
      case 'google':
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}`;
        break;
      case 'bing':
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        break;
      case 'duckduckgo':
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
        break;
      default:
        searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${numResults}`;
    }
    
    try {
      console.log(`[BrightData] SERP search: "${query}" on ${engine}`);
      
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/request`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        data: {
          zone: this.serpZone,
          url: searchUrl,
          format: options.format || 'raw'
        },
        timeout: options.timeout || 30000
      });
      
      this.stats.serp.success++;
      this.stats.serp.totalCost += 0.0015;
      
      console.log(`[BrightData] ✅ SERP success for: "${query}"`);
      
      return {
        success: true,
        data: response.data,
        query: query,
        engine: engine,
        service: 'serp',
        cost: '$0.0015'
      };
    } catch (error) {
      this.stats.serp.failed++;
      
      console.error(`[BrightData] ❌ SERP failed for: "${query}"`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        query: query,
        service: 'serp'
      };
    }
  }

  /**
   * Google search shorthand
   */
  async googleSearch(query, options = {}) {
    return this.search(query, { ...options, engine: 'google' });
  }

  /**
   * Bing search shorthand
   */
  async bingSearch(query, options = {}) {
    return this.search(query, { ...options, engine: 'bing' });
  }

  // ============================================
  // SCRAPING BROWSER API
  // Cost: $8 per GB of traffic
  // Best for: Complex JS sites, login flows, interactions
  // ============================================

  /**
   * Connect to Bright Data Scraping Browser via Playwright
   * Returns browser connection for use with Playwright
   */
  async connectBrowser() {
    this.stats.browser.requests++;
    
    try {
      // Dynamically import playwright
      const { chromium } = require('playwright');
      
      console.log('[BrightData] Connecting to Scraping Browser...');
      console.log('[BrightData] WSS endpoint:', this.browserWss.replace(/:[^:]+@/, ':****@'));
      
      const browser = await chromium.connectOverCDP(this.browserWss, {
        timeout: 60000
      });
      
      this.stats.browser.success++;
      console.log('[BrightData] ✅ Browser connected successfully');
      
      return {
        success: true,
        browser: browser,
        // Helper method to create a new page with good defaults
        createPage: async () => {
          const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-US',
            timezoneId: 'America/New_York'
          });
          return context.newPage();
        }
      };
    } catch (error) {
      this.stats.browser.failed++;
      
      console.error('[BrightData] ❌ Browser connection failed:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a browser automation task
   * @param {function} taskFn - Async function that receives (page, browser)
   * @param {object} options - Task options
   */
  async executeBrowserTask(taskFn, options = {}) {
    const connection = await this.connectBrowser();
    
    if (!connection.success) {
      return connection;
    }
    
    const { browser, createPage } = connection;
    let page = null;
    
    try {
      page = await createPage();
      page.setDefaultTimeout(options.timeout || 30000);
      
      // Execute the user's task function
      const result = await taskFn(page, browser);
      
      return {
        success: true,
        data: result,
        service: 'browser'
      };
    } catch (error) {
      console.error('[BrightData] Browser task error:', error.message);
      
      return {
        success: false,
        error: error.message,
        service: 'browser'
      };
    } finally {
      // Always clean up
      if (page) {
        await page.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Scrape a page using the Scraping Browser
   * @param {string} url - URL to scrape
   * @param {function} extractionFn - Function to extract data from page
   * @param {object} options - Scraping options
   */
  async browserScrape(url, extractionFn, options = {}) {
    return this.executeBrowserTask(async (page, browser) => {
      console.log(`[BrightData] Browser navigating to: ${url}`);
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: options.waitUntil || 'networkidle',
        timeout: options.navigationTimeout || 60000
      });
      
      // Wait for specific selector if provided
      if (options.waitForSelector) {
        console.log(`[BrightData] Waiting for selector: ${options.waitForSelector}`);
        await page.waitForSelector(options.waitForSelector, { 
          timeout: options.selectorTimeout || 30000 
        }).catch(e => console.log('[BrightData] Selector wait timeout, continuing...'));
      }
      
      // Auto-scroll if requested
      if (options.autoScroll) {
        console.log('[BrightData] Auto-scrolling page...');
        await this._autoScroll(page);
      }
      
      // Additional wait time if specified
      if (options.waitTime) {
        await page.waitForTimeout(options.waitTime);
      }
      
      // Take screenshot if requested
      let screenshot = null;
      if (options.screenshot) {
        screenshot = await page.screenshot({ 
          fullPage: options.fullPageScreenshot !== false 
        });
        console.log('[BrightData] Screenshot captured');
      }
      
      // Execute extraction function
      console.log('[BrightData] Running extraction...');
      const extractedData = await extractionFn(page);
      
      return {
        data: extractedData,
        screenshot: screenshot,
        finalUrl: page.url(),
        title: await page.title()
      };
    }, options);
  }

  /**
   * Helper: Auto-scroll page to load dynamic content
   */
  async _autoScroll(page, maxScrolls = 10) {
    await page.evaluate(async (maxScrolls) => {
      await new Promise((resolve) => {
        let scrollCount = 0;
        const distance = 500;
        const delay = 200;
        
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          scrollCount++;
          
          const scrolledToBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight;
          
          if (scrolledToBottom || scrollCount >= maxScrolls) {
            clearInterval(timer);
            // Scroll back to top
            window.scrollTo(0, 0);
            resolve();
          }
        }, delay);
      });
    }, maxScrolls);
  }

  // ============================================
  // HOTMART SPECIFIC METHODS
  // ============================================

  /**
   * Scrape Hotmart marketplace for products
   * This is the main method to fix the extraction issue!
   */
  async scrapeHotmartMarketplace(searchQuery, options = {}) {
    const url = `https://app.hotmart.com/market/search?q=${encodeURIComponent(searchQuery)}&locale=en`;
    
    console.log(`[BrightData] Starting Hotmart scrape for: "${searchQuery}"`);
    
    return this.browserScrape(url, async (page) => {
      // Wait for page to stabilize
      await page.waitForTimeout(3000);
      
      // Scroll to trigger lazy loading
      await this._autoScroll(page, 5);
      
      // Wait for content to load after scrolling
      await page.waitForTimeout(2000);
      
      // Extract products using multiple selector strategies
      const products = await page.evaluate(() => {
        const items = [];
        
        // Strategy 1: Look for common product card patterns
        const selectorStrategies = [
          '[class*="ProductCard"]',
          '[class*="product-card"]',
          '[class*="productCard"]',
          '[data-testid*="product"]',
          '[class*="Card"][class*="product"]',
          'article[class*="product"]',
          'div[class*="offer"]',
          'a[href*="/market/"][class*="card"]'
        ];
        
        let cards = [];
        
        for (const selector of selectorStrategies) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            console.log(`Found ${found.length} elements with: ${selector}`);
            cards = found;
            break;
          }
        }
        
        // Strategy 2: If no cards found, look for any links to market products
        if (cards.length === 0) {
          const marketLinks = document.querySelectorAll('a[href*="/market/"]');
          console.log(`Found ${marketLinks.length} market links`);
          
          // Group links by their parent containers
          const containers = new Set();
          marketLinks.forEach(link => {
            const parent = link.closest('div[class], article, section');
            if (parent) containers.add(parent);
          });
          cards = Array.from(containers);
        }
        
        // Extract data from each card/container
        cards.forEach((card, index) => {
          try {
            const getText = (selectors) => {
              for (const sel of selectors) {
                const el = card.querySelector(sel);
                if (el?.textContent?.trim()) {
                  return el.textContent.trim();
                }
              }
              return null;
            };
            
            const getLink = () => {
              const link = card.querySelector('a[href*="/market/"]') || 
                          card.querySelector('a[href*="hotmart"]') ||
                          (card.tagName === 'A' ? card : null);
              return link?.href || null;
            };
            
            const getImage = () => {
              const img = card.querySelector('img');
              return img?.src || img?.dataset?.src || null;
            };
            
            const product = {
              index: index,
              name: getText([
                '[class*="name"]', '[class*="Name"]',
                '[class*="title"]', '[class*="Title"]',
                'h1', 'h2', 'h3', 'h4',
                '[class*="product"] span',
                'a[href*="/market/"]'
              ]),
              price: getText([
                '[class*="price"]', '[class*="Price"]',
                '[class*="value"]', '[class*="Value"]',
                '[class*="amount"]'
              ]),
              commission: getText([
                '[class*="commission"]', '[class*="Commission"]',
                '[class*="percent"]', '[class*="Percent"]'
              ]),
              temperature: getText([
                '[class*="temperature"]', '[class*="Temperature"]',
                '[class*="hot"]', '[class*="Hot"]',
                '[class*="°"]'
              ]),
              rating: getText([
                '[class*="rating"]', '[class*="Rating"]',
                '[class*="star"]', '[class*="Star"]',
                '[class*="score"]'
              ]),
              url: getLink(),
              image: getImage(),
              rawText: card.textContent?.substring(0, 300)?.trim()
            };
            
            // Only add if we have meaningful data
            if (product.name || product.url || product.price) {
              items.push(product);
            }
          } catch (err) {
            console.error('Error extracting product:', err);
          }
        });
        
        return items;
      });
      
      // Get page metadata
      const pageInfo = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        totalCards: document.querySelectorAll('[class*="card"], [class*="Card"], article').length
      }));
      
      return {
        products: products,
        totalFound: products.length,
        searchQuery: searchQuery,
        pageInfo: pageInfo,
        timestamp: new Date().toISOString()
      };
    }, {
      waitUntil: 'domcontentloaded', // Don't wait for networkidle (Hotmart has too many tracking scripts)
      autoScroll: true,
      waitTime: 5000, // Give more time for React to render
      screenshot: options.screenshot || false,
      navigationTimeout: 90000 // Increase timeout
    });
  }

  /**
   * Scrape a specific Hotmart product page
   */
  async scrapeHotmartProduct(productUrl, options = {}) {
    return this.browserScrape(productUrl, async (page) => {
      await page.waitForTimeout(2000);
      
      return page.evaluate(() => {
        const getText = (selector) => {
          const el = document.querySelector(selector);
          return el?.textContent?.trim() || null;
        };
        
        return {
          name: getText('[class*="ProductName"], [class*="product-name"], h1'),
          description: getText('[class*="description"], [class*="Description"]'),
          price: getText('[class*="price"], [class*="Price"]'),
          commission: getText('[class*="commission"], [class*="Commission"]'),
          vendor: getText('[class*="vendor"], [class*="Vendor"], [class*="seller"]'),
          category: getText('[class*="category"], [class*="Category"]'),
          temperature: getText('[class*="temperature"], [class*="°"]'),
          rating: getText('[class*="rating"], [class*="Rating"]'),
          url: window.location.href,
          scrapedAt: new Date().toISOString()
        };
      });
    }, options);
  }

  // ============================================
  // STATISTICS & UTILITIES
  // ============================================

  /**
   * Get usage statistics
   */
  getStats() {
    const totalRequests = this.stats.webUnlocker.requests + 
                         this.stats.browser.requests + 
                         this.stats.serp.requests;
    
    const totalSuccess = this.stats.webUnlocker.success + 
                        this.stats.browser.success + 
                        this.stats.serp.success;
    
    const totalCost = this.stats.webUnlocker.totalCost + 
                     this.stats.browser.totalCost + 
                     this.stats.serp.totalCost;
    
    return {
      services: this.stats,
      totals: {
        requests: totalRequests,
        success: totalSuccess,
        failed: totalRequests - totalSuccess,
        successRate: totalRequests > 0 ? ((totalSuccess / totalRequests) * 100).toFixed(1) + '%' : 'N/A',
        estimatedCost: '$' + totalCost.toFixed(4)
      },
      initialized: this.initialized,
      accountId: this.accountId
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      webUnlocker: { requests: 0, success: 0, failed: 0, totalCost: 0 },
      browser: { requests: 0, success: 0, failed: 0, totalCost: 0 },
      serp: { requests: 0, success: 0, failed: 0, totalCost: 0 }
    };
    console.log('[BrightData] Statistics reset');
  }
}

module.exports = BrightDataService;
