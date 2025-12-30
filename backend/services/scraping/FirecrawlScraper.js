// backend/services/scraping/FirecrawlScraper.js

const BaseScraper = require('./BaseScraper');

class FirecrawlScraper extends BaseScraper {
  constructor(options = {}) {
    super(options);
    this.apiKey = options.apiKey;
    this.baseUrl = 'https://api.firecrawl.dev/v1';
  }

  async scrape(config) {
    const { url, platform, marketplaceId, maxProducts } = config;
    const targetCount = maxProducts || this.options.maxProducts;

    if (!this.apiKey) {
      throw new Error('Firecrawl API key required');
    }

    this.log('info', 'Starting Firecrawl scrape', { url, targetCount });
    this.reportProgress(0, targetCount, 'Initializing Firecrawl...');

    try {
      // Use Firecrawl's scrape endpoint
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          waitFor: 5000,
          actions: [
            { type: 'scroll', direction: 'down', amount: 3 }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Firecrawl API error: ${error}`);
      }

      const data = await response.json();
      this.log('info', 'Firecrawl response received');

      // Check if we have HTML content
      if (!data.data?.html) {
        throw new Error('No HTML content returned from Firecrawl');
      }

      // Parse products from HTML
      const products = await this.parseProducts(
        data.data.html,
        platform,
        marketplaceId,
        url
      );

      // Limit to target count
      const finalProducts = products.slice(0, targetCount);

      // Emit products
      finalProducts.forEach(p => {
        if (this.validateProduct(p)) {
          this.emit('product', p);
        }
      });

      this.reportProgress(finalProducts.length, targetCount, 'Scrape complete');
      this.log('info', 'Firecrawl scrape complete', { count: finalProducts.length });
      this.emit('complete', { count: finalProducts.length });

      return finalProducts;

    } catch (error) {
      this.log('error', 'Firecrawl scrape failed', { error: error.message });
      throw error;
    }
  }

  async parseProducts(html, platform, marketplaceId, baseUrl) {
    // Use simple regex-based parsing as fallback if cheerio not available
    const products = [];

    // Try to find product-like elements using regex patterns
    const productPatterns = [
      // Match product card sections
      /<(?:div|article)[^>]*(?:class|data-testid)="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi,
      /<(?:div|article)[^>]*(?:class)="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/(?:div|article)>/gi
    ];

    let matches = [];
    for (const pattern of productPatterns) {
      const found = html.matchAll(pattern);
      matches = [...matches, ...Array.from(found)];
      if (matches.length > 0) break;
    }

    for (const match of matches) {
      const cardHtml = match[1] || match[0];

      // Extract product data from card HTML
      const product = this.extractProductFromHtml(cardHtml, platform, marketplaceId, baseUrl);
      if (product && product.name) {
        products.push(product);
      }
    }

    // If no products found with patterns, try simpler extraction
    if (products.length === 0) {
      this.log('warn', 'No products found with patterns, trying fallback extraction');
      return this.fallbackExtraction(html, platform, marketplaceId, baseUrl);
    }

    return products;
  }

  extractProductFromHtml(cardHtml, platform, marketplaceId, baseUrl) {
    // Extract name from h1-h4 or class containing "name" or "title"
    const nameMatch = cardHtml.match(/<(?:h[1-4]|[^>]*(?:name|title)[^>]*)>([^<]+)</i);
    const name = nameMatch ? this.cleanText(nameMatch[1]) : null;

    // Extract price
    const priceMatch = cardHtml.match(/(?:\$|R\$|€|USD|BRL)\s*([\d,.]+)|(?:[\d,.]+)\s*(?:\$|R\$|€|USD|BRL)/i);
    const price = priceMatch ? priceMatch[1] || priceMatch[0] : null;

    // Extract link
    const linkMatch = cardHtml.match(/href="([^"]+)"/i);
    let productUrl = linkMatch ? linkMatch[1] : null;
    if (productUrl && !productUrl.startsWith('http')) {
      try {
        productUrl = new URL(productUrl, baseUrl).href;
      } catch (e) {
        // Keep as is
      }
    }

    // Extract image
    const imgMatch = cardHtml.match(/src="([^"]+(?:jpg|jpeg|png|webp|gif)[^"]*)"/i);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    // Extract description
    const descMatch = cardHtml.match(/<p[^>]*>([^<]+)</i);
    const description = descMatch ? this.cleanText(descMatch[1]) : null;

    return this.normalizeProduct({
      name,
      price,
      product_url: productUrl,
      image_url: imageUrl,
      description
    }, platform, marketplaceId);
  }

  fallbackExtraction(html, platform, marketplaceId, baseUrl) {
    const products = [];

    // Find all links that might be products
    const linkPattern = /<a[^>]*href="([^"]*(?:product|item|offer)[^"]*)"[^>]*>([^<]*)</gi;
    const matches = html.matchAll(linkPattern);

    for (const match of matches) {
      let url = match[1];
      const text = this.cleanText(match[2]);

      if (text && text.length > 3) {
        if (!url.startsWith('http')) {
          try {
            url = new URL(url, baseUrl).href;
          } catch (e) {
            continue;
          }
        }

        products.push(this.normalizeProduct({
          name: text,
          product_url: url
        }, platform, marketplaceId));
      }
    }

    return products;
  }

  cleanText(text) {
    if (!text) return null;
    return text.replace(/\s+/g, ' ').trim();
  }
}

module.exports = FirecrawlScraper;
