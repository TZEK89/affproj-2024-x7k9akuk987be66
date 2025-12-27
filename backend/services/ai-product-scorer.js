const logger = require('../config/logger');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * AI Product Scorer Service
 * 
 * Enhanced profitability scoring using AI analysis.
 * Combines the V1 base formula with LLM-powered insights.
 * 
 * Scoring Components:
 * - Base Score (40%): (Commission × Temperature) / Price
 * - Niche Competitiveness (20%): LLM analysis of market saturation
 * - Price Optimization (15%): Price point analysis
 * - Commission Sustainability (15%): Long-term viability assessment
 * - Market Demand (10%): Temperature normalization
 */

// Scoring weights - can be adjusted based on performance
const SCORING_WEIGHTS = {
  baseScore: 0.40,
  nicheCompetitiveness: 0.20,
  priceOptimization: 0.15,
  commissionSustainability: 0.15,
  marketDemand: 0.10
};

// Temperature thresholds for Hotmart
const TEMPERATURE_THRESHOLDS = {
  cold: 30,      // Below 30 = cold
  warm: 70,      // 30-70 = warm
  hot: 100,      // 70-100 = hot
  veryHot: 150   // Above 100 = very hot
};

// Price point categories (in USD)
const PRICE_CATEGORIES = {
  lowTicket: { min: 0, max: 50, optimalCommission: 0.50 },
  midTicket: { min: 50, max: 200, optimalCommission: 0.40 },
  highTicket: { min: 200, max: 500, optimalCommission: 0.30 },
  premiumTicket: { min: 500, max: Infinity, optimalCommission: 0.25 }
};

class AIProductScorer {
  constructor() {
    this.anthropic = null;
    this.batchSize = 10; // Products per LLM batch call
    this.cacheEnabled = true;
    this.analysisCache = new Map();
  }

  /**
   * Initialize Anthropic client
   */
  initializeClient() {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        logger.warn('[AI Scorer] ANTHROPIC_API_KEY not set, using rule-based scoring only');
        return false;
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return true;
  }

  /**
   * Score a single product (V1 formula only - fast)
   */
  scoreProductV1(product) {
    const { price, commission, temperature } = product;
    
    if (!price || price <= 0) {
      return { score: 0, breakdown: { error: 'Invalid price' } };
    }

    const baseScore = (commission * temperature) / price;
    
    return {
      score: Math.round(baseScore * 100) / 100,
      breakdown: {
        formula: 'V1: (Commission × Temperature) / Price',
        commission,
        temperature,
        price,
        rawScore: baseScore
      }
    };
  }

  /**
   * Score a single product with AI enhancement
   */
  async scoreProductEnhanced(product) {
    try {
      // Calculate all component scores
      const baseScore = this.calculateBaseScore(product);
      const priceScore = this.calculatePriceOptimizationScore(product);
      const demandScore = this.calculateMarketDemandScore(product);
      
      // AI-powered scores (with fallback to rule-based)
      let nicheScore = 0.5; // Default neutral
      let sustainabilityScore = 0.5; // Default neutral
      
      if (this.initializeClient()) {
        const aiAnalysis = await this.getAIAnalysis(product);
        nicheScore = aiAnalysis.nicheCompetitiveness;
        sustainabilityScore = aiAnalysis.commissionSustainability;
      } else {
        // Fallback to rule-based estimation
        nicheScore = this.estimateNicheCompetitiveness(product);
        sustainabilityScore = this.estimateCommissionSustainability(product);
      }

      // Calculate weighted composite score
      const compositeScore = 
        (baseScore * SCORING_WEIGHTS.baseScore) +
        (nicheScore * SCORING_WEIGHTS.nicheCompetitiveness) +
        (priceScore * SCORING_WEIGHTS.priceOptimization) +
        (sustainabilityScore * SCORING_WEIGHTS.commissionSustainability) +
        (demandScore * SCORING_WEIGHTS.marketDemand);

      // Normalize to 0-100 scale
      const finalScore = Math.min(100, Math.max(0, compositeScore * 100));

      return {
        score: Math.round(finalScore * 100) / 100,
        grade: this.getGrade(finalScore),
        breakdown: {
          baseScore: Math.round(baseScore * 100) / 100,
          nicheCompetitiveness: Math.round(nicheScore * 100) / 100,
          priceOptimization: Math.round(priceScore * 100) / 100,
          commissionSustainability: Math.round(sustainabilityScore * 100) / 100,
          marketDemand: Math.round(demandScore * 100) / 100
        },
        weights: SCORING_WEIGHTS,
        product: {
          name: product.name,
          price: product.price,
          commission: product.commission,
          temperature: product.temperature
        }
      };
    } catch (error) {
      logger.error('[AI Scorer] Error scoring product:', error);
      // Fallback to V1 scoring
      const v1Result = this.scoreProductV1(product);
      return {
        score: v1Result.score,
        grade: this.getGrade(v1Result.score),
        breakdown: v1Result.breakdown,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Batch score multiple products efficiently
   */
  async batchScoreProducts(products, options = {}) {
    const { useAI = true, parallel = false } = options;
    const results = [];

    logger.info(`[AI Scorer] Batch scoring ${products.length} products (AI: ${useAI})`);

    if (!useAI) {
      // Fast V1-only scoring
      for (const product of products) {
        const v1Result = this.scoreProductV1(product);
        results.push({
          ...product,
          ai_score: v1Result.score,
          score_breakdown: v1Result.breakdown,
          score_version: 'V1'
        });
      }
      return results;
    }

    // AI-enhanced scoring with batching
    const batches = this.chunkArray(products, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`[AI Scorer] Processing batch ${i + 1}/${batches.length}`);

      if (parallel) {
        // Parallel processing (faster but more API calls)
        const batchResults = await Promise.all(
          batch.map(product => this.scoreProductEnhanced(product))
        );
        
        batch.forEach((product, idx) => {
          results.push({
            ...product,
            ai_score: batchResults[idx].score,
            ai_grade: batchResults[idx].grade,
            score_breakdown: batchResults[idx].breakdown,
            score_version: 'V2-AI'
          });
        });
      } else {
        // Sequential processing (slower but more controlled)
        for (const product of batch) {
          const scoreResult = await this.scoreProductEnhanced(product);
          results.push({
            ...product,
            ai_score: scoreResult.score,
            ai_grade: scoreResult.grade,
            score_breakdown: scoreResult.breakdown,
            score_version: scoreResult.fallback ? 'V1-Fallback' : 'V2-AI'
          });
        }
      }

      // Rate limiting delay between batches
      if (i < batches.length - 1) {
        await this.delay(1000);
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.ai_score - a.ai_score);

    logger.info(`[AI Scorer] Batch scoring complete. Top score: ${results[0]?.ai_score || 0}`);

    return results;
  }

  /**
   * Calculate base score (V1 formula normalized to 0-1)
   */
  calculateBaseScore(product) {
    const { price, commission, temperature } = product;
    
    if (!price || price <= 0) return 0;

    // Raw V1 formula
    const rawScore = (commission * temperature) / price;
    
    // Normalize to 0-1 range (assuming typical range 0-10)
    const normalized = Math.min(1, rawScore / 10);
    
    return normalized;
  }

  /**
   * Calculate price optimization score
   */
  calculatePriceOptimizationScore(product) {
    const { price, commission } = product;
    
    if (!price || price <= 0) return 0;

    const commissionRate = commission / price;
    
    // Find price category
    let category = null;
    for (const [name, config] of Object.entries(PRICE_CATEGORIES)) {
      if (price >= config.min && price < config.max) {
        category = { name, ...config };
        break;
      }
    }

    if (!category) return 0.5;

    // Score based on how close commission rate is to optimal
    const optimalDiff = Math.abs(commissionRate - category.optimalCommission);
    const score = Math.max(0, 1 - (optimalDiff * 2));

    return score;
  }

  /**
   * Calculate market demand score from temperature
   */
  calculateMarketDemandScore(product) {
    const { temperature } = product;
    
    if (!temperature || temperature <= 0) return 0;

    // Normalize temperature to 0-1 scale
    // Temperature typically ranges 0-150+
    if (temperature >= TEMPERATURE_THRESHOLDS.veryHot) return 1.0;
    if (temperature >= TEMPERATURE_THRESHOLDS.hot) return 0.8;
    if (temperature >= TEMPERATURE_THRESHOLDS.warm) return 0.6;
    if (temperature >= TEMPERATURE_THRESHOLDS.cold) return 0.4;
    
    return temperature / TEMPERATURE_THRESHOLDS.cold * 0.4;
  }

  /**
   * Rule-based niche competitiveness estimation (fallback)
   */
  estimateNicheCompetitiveness(product) {
    const { temperature, price, commission } = product;
    
    // High temperature + high price = competitive niche
    // Low temperature + reasonable commission = opportunity
    
    const tempFactor = temperature > 100 ? 0.3 : 0.7; // Lower score for saturated
    const priceFactor = price > 200 ? 0.6 : 0.5;
    const commissionFactor = (commission / price) > 0.4 ? 0.7 : 0.5;
    
    return (tempFactor + priceFactor + commissionFactor) / 3;
  }

  /**
   * Rule-based commission sustainability estimation (fallback)
   */
  estimateCommissionSustainability(product) {
    const { commission, price, temperature } = product;
    
    if (!price || price <= 0) return 0;

    const commissionRate = commission / price;
    
    // Very high commission rates (>60%) may be unsustainable
    if (commissionRate > 0.6) return 0.4;
    
    // Moderate rates (30-50%) are typically sustainable
    if (commissionRate >= 0.3 && commissionRate <= 0.5) return 0.8;
    
    // Low rates (<20%) may indicate established products
    if (commissionRate < 0.2) return 0.7;
    
    return 0.6;
  }

  /**
   * Get AI analysis for a product
   */
  async getAIAnalysis(product) {
    // Check cache first
    const cacheKey = `${product.name}-${product.price}-${product.commission}`;
    if (this.cacheEnabled && this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const prompt = this.buildAnalysisPrompt(product);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 500,
        system: `You are an expert affiliate marketing analyst. Analyze products and return JSON scores.
Always respond with valid JSON in this exact format:
{"nicheCompetitiveness": 0.0-1.0, "commissionSustainability": 0.0-1.0, "reasoning": "brief explanation"}`,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0].text;
      const analysis = JSON.parse(content);

      // Validate and normalize scores
      const result = {
        nicheCompetitiveness: Math.min(1, Math.max(0, analysis.nicheCompetitiveness || 0.5)),
        commissionSustainability: Math.min(1, Math.max(0, analysis.commissionSustainability || 0.5)),
        reasoning: analysis.reasoning || ''
      };

      // Cache the result
      if (this.cacheEnabled) {
        this.analysisCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      logger.warn('[AI Scorer] AI analysis failed, using fallback:', error.message);
      return {
        nicheCompetitiveness: this.estimateNicheCompetitiveness(product),
        commissionSustainability: this.estimateCommissionSustainability(product),
        reasoning: 'Fallback to rule-based analysis'
      };
    }
  }

  /**
   * Build analysis prompt for LLM
   */
  buildAnalysisPrompt(product) {
    return `Analyze this affiliate product for profitability:

Product: ${product.name || 'Unknown'}
Price: $${product.price || 0}
Commission: $${product.commission || 0} (${product.price ? Math.round((product.commission / product.price) * 100) : 0}%)
Temperature/Gravity: ${product.temperature || 0}
Category: ${product.category || 'Digital Product'}

Score these factors from 0.0 to 1.0:

1. Niche Competitiveness (0.0 = oversaturated, 1.0 = untapped opportunity)
   Consider: market saturation, competition level, differentiation potential

2. Commission Sustainability (0.0 = likely to decrease, 1.0 = stable long-term)
   Consider: commission rate reasonableness, product lifecycle, vendor reliability

Return JSON only.`;
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Utility: chunk array into batches
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    logger.info('[AI Scorer] Cache cleared');
  }

  /**
   * Get scoring statistics
   */
  getStats() {
    return {
      cacheSize: this.analysisCache.size,
      weights: SCORING_WEIGHTS,
      temperatureThresholds: TEMPERATURE_THRESHOLDS,
      priceCategories: Object.keys(PRICE_CATEGORIES)
    };
  }
}

module.exports = new AIProductScorer();
