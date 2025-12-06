/**
 * Agent Executor
 * Executes agent missions using browser automation and AI analysis
 */

const HotmartAutomation = require('../browser/HotmartAutomation');
const AIService = require('../ai/AIService');
const db = require('../../db');

class AgentExecutor {
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Execute a research mission
   * @param {Object} mission - Mission object from database
   * @param {Object} credentials - User credentials for platform
   * @returns {Promise<Object>} - Execution results
   */
  async executeMission(mission, credentials) {
    console.log(`🚀 Executing mission #${mission.id}: ${mission.prompt}`);
    
    const startTime = Date.now();
    let browser = null;

    try {
      // Update mission status to 'running'
      await this.updateMissionStatus(mission.id, 'running');
      await this.logAction(mission.id, 'mission_started', { prompt: mission.prompt });

      // Initialize browser automation based on platform
      browser = await this.getBrowserAutomation(mission.platform);
      await browser.launch();

      // Login to platform
      await this.logAction(mission.id, 'logging_in', { platform: mission.platform });
      const loginSuccess = await browser.login(credentials.email, credentials.password);
      
      if (!loginSuccess) {
        throw new Error('Login failed');
      }

      await this.logAction(mission.id, 'login_success');

      // Execute research based on mission type
      let results;
      if (mission.mission_type === 'research') {
        results = await this.executeResearch(browser, mission);
      } else {
        throw new Error(`Unknown mission type: ${mission.mission_type}`);
      }

      // Analyze results with AI
      await this.logAction(mission.id, 'analyzing_results', { productsFound: results.length });
      const analyzedProducts = await this.analyzeProducts(mission, results);

      // Save discovered products to database
      await this.saveDiscoveredProducts(mission.id, analyzedProducts);

      // Update mission status to 'completed'
      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.updateMissionStatus(mission.id, 'completed', {
        completed_at: new Date(),
        results_summary: {
          productsFound: analyzedProducts.length,
          duration,
          platform: mission.platform
        }
      });

      await this.logAction(mission.id, 'mission_completed', {
        productsFound: analyzedProducts.length,
        duration
      });

      console.log(`✅ Mission #${mission.id} completed in ${duration}s`);

      return {
        success: true,
        productsFound: analyzedProducts.length,
        duration,
        products: analyzedProducts
      };

    } catch (error) {
      console.error(`❌ Mission #${mission.id} failed:`, error.message);

      // Update mission status to 'failed'
      await this.updateMissionStatus(mission.id, 'failed', {
        error_message: error.message
      });

      await this.logAction(mission.id, 'mission_failed', {
        error: error.message,
        stack: error.stack
      });

      throw error;

    } finally {
      // Always close browser
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Execute research mission
   * @param {Object} browser - Browser automation instance
   * @param {Object} mission - Mission object
   * @returns {Promise<Array>} - Research results
   */
  async executeResearch(browser, mission) {
    await this.logAction(mission.id, 'starting_research', { prompt: mission.prompt });

    // Extract niche from prompt using simple keyword extraction
    const niche = this.extractNiche(mission.prompt);
    
    // Parse parameters
    const params = typeof mission.parameters === 'string' 
      ? JSON.parse(mission.parameters) 
      : mission.parameters;

    const maxProducts = params.maxProducts || 10;
    const language = params.language || null;
    const getDetails = params.getDetails !== false;

    // Execute niche research
    const products = await browser.researchNiche(niche, {
      maxProducts,
      language,
      sortBy: 'best_sellers',
      getDetails
    });

    await this.logAction(mission.id, 'research_completed', {
      productsFound: products.length,
      niche
    });

    return products;
  }

  /**
   * Analyze products using AI
   * @param {Object} mission - Mission object
   * @param {Array} products - Raw product data
   * @returns {Promise<Array>} - Analyzed products with AI scores
   */
  async analyzeProducts(mission, products) {
    if (products.length === 0) {
      return [];
    }

    console.log(`🤖 Analyzing ${products.length} products with AI...`);

    const prompt = `
You are an expert affiliate marketer analyzing products for potential promotion.

User's research request: "${mission.prompt}"

Products found:
${products.map((p, i) => `
${i + 1}. ${p.name}
   Price: ${p.price || 'Unknown'}
   Commission: ${p.commission || 'Unknown'}
   Category: ${p.category || 'Unknown'}
   Rating: ${p.rating || 'Unknown'}
`).join('\n')}

For each product, provide:
1. AI Score (0-100): Overall potential for affiliate success
2. Strengths: Key selling points
3. Weaknesses: Potential concerns
4. Recommendation: Brief action recommendation

Respond in JSON format:
{
  "products": [
    {
      "index": 0,
      "aiScore": 85,
      "strengths": ["High commission", "Popular niche"],
      "weaknesses": ["High competition"],
      "recommendation": "Highly recommended for promotion"
    }
  ]
}
`;

    try {
      const analysis = await this.aiService.chat(prompt, {
        temperature: 0.3,
        maxTokens: 2000
      });

      // Parse AI response
      const analysisData = JSON.parse(analysis);

      // Merge AI analysis with product data
      const analyzedProducts = products.map((product, index) => {
        const aiAnalysis = analysisData.products.find(p => p.index === index) || {
          aiScore: 50,
          strengths: [],
          weaknesses: [],
          recommendation: 'Needs manual review'
        };

        return {
          ...product,
          aiScore: aiAnalysis.aiScore,
          aiStrengths: aiAnalysis.strengths,
          aiWeaknesses: aiAnalysis.weaknesses,
          aiRecommendation: aiAnalysis.recommendation
        };
      });

      console.log(`✅ AI analysis completed`);
      return analyzedProducts;

    } catch (error) {
      console.error('⚠️  AI analysis failed, returning products without scores:', error.message);
      
      // Return products with default scores if AI fails
      return products.map(product => ({
        ...product,
        aiScore: 50,
        aiStrengths: [],
        aiWeaknesses: [],
        aiRecommendation: 'AI analysis unavailable'
      }));
    }
  }

  /**
   * Save discovered products to database
   * @param {number} missionId - Mission ID
   * @param {Array} products - Products to save
   * @returns {Promise<void>}
   */
  async saveDiscoveredProducts(missionId, products) {
    console.log(`💾 Saving ${products.length} discovered products...`);

    for (const product of products) {
      try {
        await db.query(`
          INSERT INTO discovered_products (
            mission_id, platform, name, description, price, commission_rate,
            commission_type, category, niche, product_url, image_url,
            sales_page_url, producer_name, rating, total_sales, guarantee_days,
            language, ai_score, ai_analysis, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          missionId,
          product.platform || 'hotmart',
          product.name,
          product.description || null,
          product.price || null,
          product.commission || null,
          product.commissionType || 'percentage',
          product.category || null,
          this.extractNiche(product.name), // Extract niche from product name
          product.productUrl || null,
          product.imageUrl || null,
          product.salesPage || null,
          product.producer || null,
          product.rating || null,
          product.totalSales || null,
          product.guaranteeDays || null,
          product.language || null,
          product.aiScore || 50,
          JSON.stringify({
            strengths: product.aiStrengths || [],
            weaknesses: product.aiWeaknesses || [],
            recommendation: product.aiRecommendation || ''
          }),
          'pending'
        ]);
      } catch (error) {
        console.error(`⚠️  Failed to save product "${product.name}":`, error.message);
      }
    }

    console.log(`✅ Saved ${products.length} products to database`);
  }

  /**
   * Get browser automation instance for platform
   * @param {string} platform - Platform name
   * @returns {Object} - Browser automation instance
   */
  async getBrowserAutomation(platform) {
    switch (platform.toLowerCase()) {
      case 'hotmart':
        return new HotmartAutomation();
      // TODO: Add other platforms (Impact, ClickBank, ShareASale)
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Extract niche keywords from prompt or text
   * @param {string} text - Text to extract niche from
   * @returns {string} - Extracted niche
   */
  extractNiche(text) {
    // Simple keyword extraction - remove common words
    const stopWords = ['find', 'search', 'research', 'products', 'in', 'the', 'for', 'niche', 'marketplace', 'top', 'best'];
    const words = text.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    return keywords.join(' ').substring(0, 100);
  }

  /**
   * Update mission status in database
   * @param {number} missionId - Mission ID
   * @param {string} status - New status
   * @param {Object} updates - Additional fields to update
   * @returns {Promise<void>}
   */
  async updateMissionStatus(missionId, status, updates = {}) {
    const fields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [missionId, status];
    let paramIndex = 3;

    if (updates.completed_at) {
      fields.push(`completed_at = $${paramIndex}`);
      values.push(updates.completed_at);
      paramIndex++;
    }

    if (updates.error_message) {
      fields.push(`error_message = $${paramIndex}`);
      values.push(updates.error_message);
      paramIndex++;
    }

    if (updates.results_summary) {
      fields.push(`results_summary = $${paramIndex}`);
      values.push(JSON.stringify(updates.results_summary));
      paramIndex++;
    }

    await db.query(`
      UPDATE agent_missions 
      SET ${fields.join(', ')}
      WHERE id = $1
    `, values);

    console.log(`📝 Mission #${missionId} status updated to: ${status}`);
  }

  /**
   * Log an action to agent_logs table
   * @param {number} missionId - Mission ID
   * @param {string} action - Action type
   * @param {Object} details - Action details
   * @returns {Promise<void>}
   */
  async logAction(missionId, action, details = {}) {
    try {
      await db.query(`
        INSERT INTO agent_logs (mission_id, action, details, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [missionId, action, JSON.stringify(details)]);
    } catch (error) {
      console.error('⚠️  Failed to log action:', error.message);
    }
  }
}

module.exports = AgentExecutor;
