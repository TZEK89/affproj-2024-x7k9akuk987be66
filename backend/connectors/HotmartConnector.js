const MarketplaceConnector = require('./MarketplaceConnector');
const logger = require('../config/logger');

/**
 * HotmartConnector
 * 
 * Concrete implementation for Hotmart marketplace
 */

class HotmartConnector extends MarketplaceConnector {
  constructor() {
    super('hotmart');
  }

  /**
   * Extract products from current page
   */
  async extractProducts(page) {
    const targetPage = page || this.page;
    
    logger.info(`[${this.platform}] Extracting products from page`);

    const products = await targetPage.evaluate((selectors) => {
      const productElements = document.querySelectorAll(selectors.productCard);
      const results = [];

      productElements.forEach(el => {
        try {
          const name = el.querySelector(selectors.name)?.textContent?.trim();
          const priceText = el.querySelector(selectors.price)?.textContent?.trim();
          const commissionText = el.querySelector(selectors.commission)?.textContent?.trim();
          const temperatureText = el.querySelector(selectors.temperature)?.textContent?.trim();

          if (name) {
            results.push({
              name,
              priceText,
              commissionText,
              temperatureText
            });
          }
        } catch (error) {
          // Skip invalid products
        }
      });

      return results;
    }, this.config.selectors);

    logger.info(`[${this.platform}] Extracted ${products.length} products`);

    return products;
  }

  /**
   * Score a product using Hotmart-specific profitability formula
   * 
   * Formula: (Commission Amount × Temperature) / Price
   */
  scoreProduct(productData) {
    try {
      const price = this.parsePrice(productData.priceText);
      const commission = this.parseCommission(productData.commissionText, price);
      const temperature = this.parseTemperature(productData.temperatureText);

      // Calculate profitability score
      const profitabilityScore = price > 0 ? (commission * temperature) / price : 0;

      return {
        ...productData,
        price,
        commission,
        temperature,
        profitability_score: Math.round(profitabilityScore * 100) / 100
      };
    } catch (error) {
      logger.error(`[${this.platform}] Error scoring product:`, error);
      return {
        ...productData,
        price: 0,
        commission: 0,
        temperature: 0,
        profitability_score: 0
      };
    }
  }

  /**
   * Parse price from text
   */
  parsePrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Parse commission from text
   */
  parseCommission(commissionText, price) {
    if (!commissionText) return 0;
    
    // Check if it's a percentage
    if (commissionText.includes('%')) {
      const percentage = parseFloat(commissionText.replace(/[^\d.]/g, ''));
      return (price * percentage) / 100;
    }
    
    // Otherwise, assume it's an amount
    const match = commissionText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Parse temperature/gravity score
   */
  parseTemperature(temperatureText) {
    if (!temperatureText) return 1;
    const match = temperatureText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 1;
  }
}

module.exports = HotmartConnector;
