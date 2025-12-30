// backend/services/scraping/ScraperFactory.js

const PlaywrightScraper = require('./PlaywrightScraper');
const FirecrawlScraper = require('./FirecrawlScraper');

class ScraperFactory {
  /**
   * Create scraper instance based on type
   */
  static create(type, config = {}) {
    switch (type) {
      case 'playwright':
        return new PlaywrightScraper(config);

      case 'firecrawl':
        if (!config.apiKey) {
          throw new Error('Firecrawl API key required');
        }
        return new FirecrawlScraper(config);

      case 'brightdata':
        // Use existing BrightData service integration
        // For now, fall back to Playwright
        console.warn('Bright Data scraper using Playwright fallback');
        return new PlaywrightScraper(config);

      case 'agentic':
        // TODO: Implement Agentic scraper
        console.warn('Agentic scraper not yet implemented, using Playwright');
        return new PlaywrightScraper(config);

      default:
        // Default to Playwright
        return new PlaywrightScraper(config);
    }
  }

  /**
   * Get available scraper types
   */
  static getAvailableTypes() {
    return [
      {
        type: 'playwright',
        name: 'Built-in (Playwright)',
        available: true,
        description: 'Free built-in browser automation'
      },
      {
        type: 'firecrawl',
        name: 'Firecrawl',
        available: true,
        description: 'AI-powered web scraping API'
      },
      {
        type: 'brightdata',
        name: 'Bright Data',
        available: true,
        description: 'Enterprise proxy network'
      },
      {
        type: 'agentic',
        name: 'AI Agent',
        available: false,
        comingSoon: true,
        description: 'LLM-directed scraping'
      }
    ];
  }

  /**
   * Check if a scraper type is available
   */
  static isAvailable(type) {
    const types = this.getAvailableTypes();
    const found = types.find(t => t.type === type);
    return found?.available || false;
  }
}

module.exports = ScraperFactory;
