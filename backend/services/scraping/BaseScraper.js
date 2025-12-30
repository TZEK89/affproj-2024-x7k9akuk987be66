// backend/services/scraping/BaseScraper.js

const EventEmitter = require('events');

/**
 * Abstract base class for all scrapers
 * Emits events: 'progress', 'product', 'error', 'log', 'complete'
 */
class BaseScraper extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxProducts: 100,
      timeout: 60000,
      retries: 3,
      delayBetweenRequests: 1000,
      ...options
    };
    this.products = [];
    this.errors = [];
    this.logs = [];
  }

  /**
   * Main scrape method - must be implemented by subclasses
   */
  async scrape(config) {
    throw new Error('scrape() must be implemented by subclass');
  }

  /**
   * Log message and emit
   */
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    this.logs.push(entry);
    this.emit('log', entry);

    if (level === 'error') {
      console.error(`[Scraper] ${message}`, data);
    } else {
      console.log(`[Scraper] ${message}`, data);
    }
  }

  /**
   * Validate scraped product
   */
  validateProduct(product) {
    const required = ['name', 'product_url'];
    const missing = required.filter(field => !product[field]);

    if (missing.length > 0) {
      this.log('warn', `Product missing fields: ${missing.join(', ')}`, { product });
      return false;
    }

    return true;
  }

  /**
   * Normalize product to standard schema
   */
  normalizeProduct(raw, platform, marketplaceId) {
    return {
      name: raw.name?.trim() || 'Unknown Product',
      description: raw.description?.trim() || null,
      price: this.parsePrice(raw.price),
      currency: raw.currency || 'USD',
      image_url: raw.image_url || raw.image || null,
      product_url: this.normalizeUrl(raw.product_url || raw.url || raw.link),
      platform,
      marketplace_id: marketplaceId,

      // Platform-specific
      temperature: raw.temperature ? parseInt(raw.temperature) : null,
      gravity: raw.gravity ? parseFloat(raw.gravity) : null,

      // Metadata
      category: raw.category || null,
      subcategory: raw.subcategory || null,
      network_id: raw.network_id || raw.id || null,

      // Timestamps
      scraped_at: new Date().toISOString()
    };
  }

  /**
   * Parse price from various formats
   */
  parsePrice(priceStr) {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return null;

    // Handle formats: "$47.00", "R$ 197,00", "€ 29.99"
    const cleaned = priceStr
      .replace(/[^\d.,]/g, '')  // Remove non-numeric except . and ,
      .replace(',', '.');       // Normalize decimal separator

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Normalize URL to absolute
   */
  normalizeUrl(url, baseUrl = '') {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/') && baseUrl) {
      const base = new URL(baseUrl);
      return `${base.origin}${url}`;
    }
    return url;
  }

  /**
   * Report progress
   */
  reportProgress(current, total, message = '') {
    const progress = Math.min(100, Math.round((current / total) * 100));
    this.emit('progress', { current, total, progress, message });
  }

  /**
   * Random delay (human-like)
   */
  async randomDelay(min = 500, max = 2000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Get random user agent
   */
  getRandomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
}

module.exports = BaseScraper;
