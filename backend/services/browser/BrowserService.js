/**
 * Browser Service
 * Core browser automation utilities using Playwright
 */

const { chromium } = require('playwright');

class BrowserService {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Launch a new browser instance
   * @param {Object} options - Browser launch options
   * @returns {Promise<void>}
   */
  async launch(options = {}) {
    const defaultOptions = {
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    };

    this.browser = await chromium.launch({ ...defaultOptions, ...options });
    
    // Create a new context with realistic settings
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      geolocation: null,
      colorScheme: 'light'
    });

    this.page = await this.context.newPage();
    
    console.log('✅ Browser launched successfully');
  }

  /**
   * Navigate to a URL
   * @param {string} url - Target URL
   * @param {Object} options - Navigation options
   * @returns {Promise<void>}
   */
  async goto(url, options = {}) {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }

    const defaultOptions = {
      waitUntil: 'networkidle',
      timeout: 30000
    };

    await this.page.goto(url, { ...defaultOptions, ...options });
    console.log(`📍 Navigated to: ${url}`);
  }

  /**
   * Wait for a selector to appear
   * @param {string} selector - CSS selector
   * @param {Object} options - Wait options
   * @returns {Promise<ElementHandle>}
   */
  async waitForSelector(selector, options = {}) {
    const defaultOptions = {
      timeout: 10000,
      state: 'visible'
    };

    return await this.page.waitForSelector(selector, { ...defaultOptions, ...options });
  }

  /**
   * Click an element
   * @param {string} selector - CSS selector
   * @param {Object} options - Click options
   * @returns {Promise<void>}
   */
  async click(selector, options = {}) {
    await this.waitForSelector(selector);
    await this.page.click(selector, options);
    console.log(`🖱️  Clicked: ${selector}`);
  }

  /**
   * Type text into an input
   * @param {string} selector - CSS selector
   * @param {string} text - Text to type
   * @param {Object} options - Type options
   * @returns {Promise<void>}
   */
  async type(selector, text, options = {}) {
    await this.waitForSelector(selector);
    await this.page.fill(selector, text, options);
    console.log(`⌨️  Typed into: ${selector}`);
  }

  /**
   * Extract text from an element
   * @param {string} selector - CSS selector
   * @returns {Promise<string|null>}
   */
  async getText(selector) {
    try {
      await this.waitForSelector(selector, { timeout: 5000 });
      return await this.page.textContent(selector);
    } catch (error) {
      console.log(`⚠️  Could not find: ${selector}`);
      return null;
    }
  }

  /**
   * Extract text from multiple elements
   * @param {string} selector - CSS selector
   * @returns {Promise<string[]>}
   */
  async getTextAll(selector) {
    try {
      const elements = await this.page.$$(selector);
      const texts = await Promise.all(
        elements.map(el => el.textContent())
      );
      return texts.filter(text => text && text.trim());
    } catch (error) {
      console.log(`⚠️  Could not find elements: ${selector}`);
      return [];
    }
  }

  /**
   * Extract attribute from an element
   * @param {string} selector - CSS selector
   * @param {string} attribute - Attribute name
   * @returns {Promise<string|null>}
   */
  async getAttribute(selector, attribute) {
    try {
      await this.waitForSelector(selector, { timeout: 5000 });
      return await this.page.getAttribute(selector, attribute);
    } catch (error) {
      console.log(`⚠️  Could not get attribute ${attribute} from: ${selector}`);
      return null;
    }
  }

  /**
   * Take a screenshot
   * @param {string} path - File path to save screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise<Buffer>}
   */
  async screenshot(path = null, options = {}) {
    const defaultOptions = {
      fullPage: true,
      type: 'png'
    };

    if (path) {
      defaultOptions.path = path;
    }

    const screenshot = await this.page.screenshot({ ...defaultOptions, ...options });
    console.log(`📸 Screenshot saved: ${path || 'buffer'}`);
    return screenshot;
  }

  /**
   * Execute JavaScript in the page context
   * @param {Function|string} script - JavaScript to execute
   * @param {*} args - Arguments to pass to the script
   * @returns {Promise<*>}
   */
  async evaluate(script, ...args) {
    return await this.page.evaluate(script, ...args);
  }

  /**
   * Wait for a specific amount of time
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise<void>}
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
    console.log(`⏱️  Waited ${ms}ms`);
  }

  /**
   * Scroll to bottom of page
   * @returns {Promise<void>}
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.wait(1000); // Wait for lazy-loaded content
    console.log('📜 Scrolled to bottom');
  }

  /**
   * Check if an element exists
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>}
   */
  async exists(selector) {
    try {
      await this.waitForSelector(selector, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close the browser
   * @returns {Promise<void>}
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      console.log('❌ Browser closed');
    }
  }

  /**
   * Get current page URL
   * @returns {string}
   */
  getUrl() {
    return this.page ? this.page.url() : null;
  }

  /**
   * Get page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return this.page ? await this.page.title() : null;
  }

  /**
   * Save cookies
   * @returns {Promise<Array>}
   */
  async getCookies() {
    return this.context ? await this.context.cookies() : [];
  }

  /**
   * Load cookies
   * @param {Array} cookies - Cookies to load
   * @returns {Promise<void>}
   */
  async setCookies(cookies) {
    if (this.context) {
      await this.context.addCookies(cookies);
      console.log('🍪 Cookies loaded');
    }
  }
}

module.exports = BrowserService;
