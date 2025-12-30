// backend/services/scraping/PlaywrightScraper.js

const { chromium } = require('playwright');
const BaseScraper = require('./BaseScraper');
const { getSelectorsForPlatform, findWorkingSelector } = require('./selectors/HotmartSelectors');

class PlaywrightScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
    this.browser = null;
    this.page = null;
    this.discoveredSelectors = {};
  }

  async scrape(config) {
    const {
      url,
      platform,
      marketplaceId,
      maxProducts
    } = config;

    const targetCount = maxProducts || this.options.maxProducts;
    this.log('info', `Starting Playwright scrape`, { url, targetCount });

    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });

      const context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US'
      });

      this.page = await context.newPage();

      // Block unnecessary resources to speed up loading
      await this.page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          route.abort();
        } else {
          route.continue();
        }
      });

      // Navigate
      this.log('info', 'Navigating to marketplace...');
      this.reportProgress(0, targetCount, 'Loading marketplace...');

      await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout
      });

      // Wait for content to load
      await this.page.waitForTimeout(3000);

      // Get selectors for platform
      const selectors = getSelectorsForPlatform(platform);

      // Discover working selectors
      await this.discoverSelectors(selectors);

      // Scrape products
      const products = await this.scrapeProducts(targetCount, platform, marketplaceId);

      this.log('info', `Scrape complete`, { productsFound: products.length });
      this.emit('complete', {
        count: products.length,
        logs: this.logs,
        selectors: this.discoveredSelectors
      });

      return products;

    } catch (error) {
      this.log('error', 'Scrape failed', { error: error.message });
      this.emit('error', { type: 'scrape', message: error.message });
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async discoverSelectors(selectors) {
    this.log('info', 'Discovering working selectors...');

    // Find product card selector
    const cardSelector = await findWorkingSelector(this.page, 'productCard', selectors);
    if (!cardSelector) {
      throw new Error('Could not find product cards on page');
    }
    this.discoveredSelectors.productCard = cardSelector;

    // Find other selectors within cards
    const firstCard = this.page.locator(cardSelector).first();

    for (const field of ['name', 'price', 'image', 'link']) {
      const selector = await findWorkingSelector(firstCard, field, selectors);
      this.discoveredSelectors[field] = selector || selectors[field];
    }

    this.log('info', 'Selectors discovered', this.discoveredSelectors);
  }

  async scrapeProducts(targetCount, platform, marketplaceId) {
    const products = [];
    let noNewProductsCount = 0;
    const maxRetries = 5;

    while (products.length < targetCount && noNewProductsCount < maxRetries) {
      const lastCount = products.length;

      // Extract visible products
      const newProducts = await this.extractVisibleProducts(platform, marketplaceId);

      // Add unique products
      const existingUrls = new Set(products.map(p => p.product_url));
      const unique = newProducts.filter(p =>
        p.product_url && !existingUrls.has(p.product_url)
      );

      for (const product of unique) {
        if (this.validateProduct(product)) {
          products.push(product);
          this.emit('product', product);

          if (products.length >= targetCount) break;
        }
      }

      this.reportProgress(
        products.length,
        targetCount,
        `Found ${products.length} products`
      );

      // Check if we got new products
      if (products.length === lastCount) {
        noNewProductsCount++;
        this.log('info', `No new products (attempt ${noNewProductsCount}/${maxRetries})`);
      } else {
        noNewProductsCount = 0;
      }

      // Try to load more
      if (products.length < targetCount) {
        const loadedMore = await this.tryLoadMore();
        if (!loadedMore && noNewProductsCount >= 2) {
          this.log('info', 'No more products to load');
          break;
        }
      }

      await this.randomDelay(1000, 2000);
    }

    return products.slice(0, targetCount);
  }

  async extractVisibleProducts(platform, marketplaceId) {
    const sel = this.discoveredSelectors;

    return this.page.evaluate((selectors, plat, mkId) => {
      const cards = document.querySelectorAll(selectors.productCard);

      return Array.from(cards).map(card => {
        const getText = (s) => {
          if (!s) return null;
          const el = card.querySelector(s);
          return el?.textContent?.trim() || null;
        };

        const getAttr = (s, attr) => {
          if (!s) return null;
          const el = card.querySelector(s);
          return el?.getAttribute(attr) || null;
        };

        // Get link - try multiple approaches
        let link = getAttr(selectors.link, 'href');
        if (!link) {
          const anyLink = card.querySelector('a[href]');
          link = anyLink?.getAttribute('href');
        }

        // Normalize link
        if (link && !link.startsWith('http')) {
          link = new URL(link, window.location.origin).href;
        }

        // Get image
        let image = getAttr(selectors.image, 'src');
        if (!image) {
          image = getAttr(selectors.image, 'data-src');
        }

        // Extract temperature if visible
        let temperature = null;
        const tempEl = card.querySelector('[class*="temp"], [class*="score"], [class*="Temperature"]');
        if (tempEl) {
          const tempText = tempEl.textContent;
          const tempMatch = tempText.match(/(\d+)/);
          if (tempMatch) {
            temperature = parseInt(tempMatch[1]);
          }
        }

        return {
          name: getText(selectors.name),
          price: getText(selectors.price),
          image_url: image,
          product_url: link,
          description: getText('p, .description'),
          category: getText('.category, [class*="category"]'),
          temperature,
          platform: plat,
          marketplace_id: mkId
        };
      });
    }, sel, platform, marketplaceId);
  }

  async tryLoadMore() {
    // Try clicking "Load More" button
    const loadMoreSelectors = [
      '[data-testid="load-more"]',
      'button:has-text("Load More")',
      'button:has-text("Ver mais")',
      'button:has-text("Carregar mais")',
      'button:has-text("Show more")',
      '.load-more',
      '[class*="loadMore"]',
      '[class*="LoadMore"]'
    ];

    for (const selector of loadMoreSelectors) {
      try {
        const btn = this.page.locator(selector).first();
        if (await btn.isVisible()) {
          await btn.click();
          await this.page.waitForTimeout(2000);
          this.log('info', 'Clicked load more button');
          return true;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Try infinite scroll
    const previousHeight = await this.page.evaluate(() => document.body.scrollHeight);
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(2000);
    const newHeight = await this.page.evaluate(() => document.body.scrollHeight);

    if (newHeight > previousHeight) {
      this.log('info', 'Scrolled for more content');
      return true;
    }

    return false;
  }
}

module.exports = PlaywrightScraper;
