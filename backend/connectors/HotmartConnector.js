const MarketplaceConnector = require('./MarketplaceConnector');
const logger = require('../config/logger');
const aiProductScorer = require('../services/ai-product-scorer');

/**
 * HotmartConnector
 * 
 * Concrete implementation for Hotmart marketplace.
 * 
 * Features:
 * - Product extraction from marketplace pages
 * - V1 basic scoring (Commission × Temperature / Price)
 * - V2 AI-enhanced scoring with multiple factors
 * - Batch processing support for AI scoring
 */

class HotmartConnector extends MarketplaceConnector {
  constructor() {
    super('hotmart');
    this.useAIScoring = true; // Can be toggled
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
          
          // Try to extract category if available
          const categoryEl = el.querySelector('.category, .product-category, [data-category]');
          const category = categoryEl?.textContent?.trim() || categoryEl?.getAttribute('data-category') || null;

          // Try to extract product URL
          const linkEl = el.querySelector('a[href*="product"], a[href*="hotmart"]');
          const productUrl = linkEl?.href || null;

          if (name) {
            results.push({
              name,
              priceText,
              commissionText,
              temperatureText,
              category,
              productUrl
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
   * Score a product using V1 formula (fast, synchronous)
   * 
   * Formula: (Commission Amount × Temperature) / Price
   */
  scoreProduct(productData) {
    try {
      const price = this.parsePrice(productData.priceText);
      const commission = this.parseCommission(productData.commissionText, price);
      const temperature = this.parseTemperature(productData.temperatureText);

      // Calculate V1 profitability score
      const profitabilityScore = price > 0 ? (commission * temperature) / price : 0;

      return {
        ...productData,
        price,
        commission,
        temperature,
        profitability_score: Math.round(profitabilityScore * 100) / 100,
        score_version: 'V1'
      };
    } catch (error) {
      logger.error(`[${this.platform}] Error scoring product:`, error);
      return {
        ...productData,
        price: 0,
        commission: 0,
        temperature: 0,
        profitability_score: 0,
        score_version: 'V1',
        score_error: error.message
      };
    }
  }

  /**
   * Score a product using V2 AI-enhanced scoring (async)
   * 
   * Uses multiple factors:
   * - Base score (V1 formula)
   * - Niche competitiveness
   * - Price optimization
   * - Commission sustainability
   * - Market demand
   */
  async scoreProductAI(productData) {
    try {
      const price = this.parsePrice(productData.priceText);
      const commission = this.parseCommission(productData.commissionText, price);
      const temperature = this.parseTemperature(productData.temperatureText);

      const product = {
        name: productData.name,
        price,
        commission,
        temperature,
        category: productData.category || 'Digital Product'
      };

      const aiResult = await aiProductScorer.scoreProductEnhanced(product);

      return {
        ...productData,
        price,
        commission,
        temperature,
        profitability_score: aiResult.score,
        ai_grade: aiResult.grade,
        score_breakdown: aiResult.breakdown,
        score_version: aiResult.fallback ? 'V1-Fallback' : 'V2-AI'
      };
    } catch (error) {
      logger.error(`[${this.platform}] Error in AI scoring:`, error);
      // Fallback to V1 scoring
      return this.scoreProduct(productData);
    }
  }

  /**
   * Batch score products with AI (efficient for large sets)
   */
  async batchScoreProductsAI(products, options = {}) {
    const { useAI = this.useAIScoring, parallel = false } = options;

    logger.info(`[${this.platform}] Batch scoring ${products.length} products (AI: ${useAI})`);

    // First, parse all products
    const parsedProducts = products.map(p => ({
      ...p,
      price: this.parsePrice(p.priceText),
      commission: this.parseCommission(p.commissionText, this.parsePrice(p.priceText)),
      temperature: this.parseTemperature(p.temperatureText),
      category: p.category || 'Digital Product'
    }));

    // Use AI scorer for batch processing
    const scoredProducts = await aiProductScorer.batchScoreProducts(parsedProducts, {
      useAI,
      parallel
    });

    // Map back to original format with scores
    return scoredProducts.map(scored => ({
      name: scored.name,
      priceText: scored.priceText,
      commissionText: scored.commissionText,
      temperatureText: scored.temperatureText,
      category: scored.category,
      productUrl: scored.productUrl,
      price: scored.price,
      commission: scored.commission,
      temperature: scored.temperature,
      profitability_score: scored.ai_score,
      ai_grade: scored.ai_grade,
      score_breakdown: scored.score_breakdown,
      score_version: scored.score_version
    }));
  }

  /**
   * Parse price from text
   */
  parsePrice(priceText) {
    if (!priceText) return 0;
    
    // Handle various currency formats
    // R$ 197,00 (Brazilian Real)
    // $197.00 (USD)
    // 197.00 (plain number)
    
    // Remove currency symbols and normalize
    const cleaned = priceText
      .replace(/[R$€£¥]/g, '')
      .replace(/\s/g, '')
      .trim();
    
    // Handle Brazilian format (comma as decimal separator)
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      // 197,00 -> 197.00
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    }
    
    // Handle US format or plain number
    const match = cleaned.match(/[\d,]+\.?\d*/);
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
    
    // Handle currency format (same as price)
    const cleaned = commissionText
      .replace(/[R$€£¥]/g, '')
      .replace(/\s/g, '')
      .trim();
    
    // Handle Brazilian format
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return parseFloat(normalized) || 0;
    }
    
    // Otherwise, assume it's an amount
    const match = cleaned.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Parse temperature/gravity score
   */
  parseTemperature(temperatureText) {
    if (!temperatureText) return 1;
    
    // Temperature is typically displayed as a number (0-150+)
    // Sometimes with degree symbol or "°C"
    const cleaned = temperatureText.replace(/[°C]/g, '').trim();
    const match = cleaned.match(/[\d,]+\.?\d*/);
    
    return match ? parseFloat(match[0].replace(/,/g, '')) : 1;
  }

  /**
   * Get top products by score
   */
  getTopProducts(products, limit = 10) {
    return [...products]
      .sort((a, b) => (b.profitability_score || 0) - (a.profitability_score || 0))
      .slice(0, limit);
  }

  /**
   * Filter products by minimum score
   */
  filterByMinScore(products, minScore = 50) {
    return products.filter(p => (p.profitability_score || 0) >= minScore);
  }

  /**
   * Get products by grade
   */
  filterByGrade(products, grades = ['A+', 'A', 'A-', 'B+']) {
    return products.filter(p => grades.includes(p.ai_grade));
  }

  /**
   * Toggle AI scoring on/off
   */
  setAIScoring(enabled) {
    this.useAIScoring = enabled;
    logger.info(`[${this.platform}] AI scoring ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get scoring statistics
   */
  getScoringStats() {
    return {
      platform: this.platform,
      aiScoringEnabled: this.useAIScoring,
      ...aiProductScorer.getStats()
    };
  }
}

module.exports = HotmartConnector;
