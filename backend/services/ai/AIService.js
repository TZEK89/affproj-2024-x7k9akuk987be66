/**
 * AI Service Abstraction Layer
 * Provides a unified interface for multiple AI providers
 */

const ManusProvider = require('./providers/ManusProvider');
const OpenAIProvider = require('./providers/OpenAIProvider');
const StabilityProvider = require('./providers/StabilityProvider');
const pool = require('../../db');

class AIService {
  constructor() {
    this.providers = {
      manus: new ManusProvider(),
      openai: new OpenAIProvider(),
      stability: new StabilityProvider()
    };
  }

  /**
   * Get the appropriate provider for a task
   * @param {string} providerName - Name of the provider (or 'auto')
   * @param {string} taskType - Type of task ('image', 'text', 'analysis', 'chat')
   * @param {number} userId - User ID for preferences
   * @returns {Promise<Object>} Provider instance
   */
  async getProvider(providerName, taskType, userId) {
    // If specific provider requested, use it
    if (providerName && providerName !== 'auto' && this.providers[providerName]) {
      return this.providers[providerName];
    }

    // Get user's default provider for this task type
    if (userId) {
      const defaultProvider = await this.getUserDefaultProvider(userId, taskType);
      if (defaultProvider && this.providers[defaultProvider]) {
        return this.providers[defaultProvider];
      }
    }

    // Fallback to system default based on task type
    const defaults = {
      image: 'manus',
      text: 'manus',
      analysis: 'manus',
      chat: 'manus'
    };

    const defaultProviderName = defaults[taskType] || 'manus';
    return this.providers[defaultProviderName];
  }

  /**
   * Get user's default provider for a task type
   */
  async getUserDefaultProvider(userId, taskType) {
    const column = `is_default_${taskType}`;
    const result = await pool.query(
      `SELECT provider_name FROM user_ai_settings 
       WHERE user_id = $1 AND ${column} = true LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.provider_name;
  }

  /**
   * Generate an image
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated image data
   */
  async generateImage(options) {
    const {
      provider = 'auto',
      prompt,
      style,
      size = '1024x1024',
      userId,
      productId,
      apiKey
    } = options;

    const startTime = Date.now();
    let result;
    let error;
    let providerInstance;

    try {
      // Get provider
      providerInstance = await this.getProvider(provider, 'image', userId);
      const providerName = providerInstance.name;

      // Get API key (user's key or system default)
      const finalApiKey = apiKey || await this.getApiKey(userId, providerName);

      // Generate image
      result = await providerInstance.generateImage({
        prompt,
        style,
        size,
        apiKey: finalApiKey
      });

      // Log success
      await this.logGeneration({
        userId,
        productId,
        providerName,
        generationType: 'image',
        prompt,
        result: JSON.stringify(result),
        resultUrl: result.url,
        cost: result.cost || 0,
        durationMs: Date.now() - startTime,
        status: 'success'
      });

      return {
        success: true,
        imageUrl: result.url,
        provider: providerName,
        metadata: result.metadata
      };

    } catch (err) {
      error = err.message;
      
      // Log failure
      await this.logGeneration({
        userId,
        productId,
        providerName: providerInstance?.name || provider,
        generationType: 'image',
        prompt,
        cost: 0,
        durationMs: Date.now() - startTime,
        status: 'failed',
        errorMessage: error
      });

      throw new Error(`Image generation failed: ${error}`);
    }
  }

  /**
   * Generate text content
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated content
   */
  async generateContent(options) {
    const {
      provider = 'auto',
      type = 'description',
      context,
      length = 'medium',
      tone = 'professional',
      userId,
      productId,
      apiKey
    } = options;

    const startTime = Date.now();
    let result;
    let error;
    let providerInstance;

    try {
      // Get provider
      providerInstance = await this.getProvider(provider, 'text', userId);
      const providerName = providerInstance.name;

      // Get API key
      const finalApiKey = apiKey || await this.getApiKey(userId, providerName);

      // Generate content
      result = await providerInstance.generateContent({
        type,
        context,
        length,
        tone,
        apiKey: finalApiKey
      });

      // Log success
      await this.logGeneration({
        userId,
        productId,
        providerName,
        generationType: type,
        prompt: JSON.stringify(context),
        result: result.content,
        cost: result.cost || 0,
        durationMs: Date.now() - startTime,
        status: 'success'
      });

      return {
        success: true,
        content: result.content,
        provider: providerName,
        metadata: result.metadata
      };

    } catch (err) {
      error = err.message;
      
      // Log failure
      await this.logGeneration({
        userId,
        productId,
        providerName: providerInstance?.name || provider,
        generationType: type,
        prompt: JSON.stringify(context),
        cost: 0,
        durationMs: Date.now() - startTime,
        status: 'failed',
        errorMessage: error
      });

      throw new Error(`Content generation failed: ${error}`);
    }
  }

  /**
   * Analyze data
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeData(options) {
    const {
      provider = 'auto',
      type = 'performance',
      data,
      userId,
      apiKey
    } = options;

    const startTime = Date.now();
    let result;
    let error;
    let providerInstance;

    try {
      // Get provider
      providerInstance = await this.getProvider(provider, 'analysis', userId);
      const providerName = providerInstance.name;

      // Get API key
      const finalApiKey = apiKey || await this.getApiKey(userId, providerName);

      // Analyze
      result = await providerInstance.analyzeData({
        type,
        data,
        apiKey: finalApiKey
      });

      // Log success
      await this.logGeneration({
        userId,
        providerName,
        generationType: 'analysis',
        prompt: JSON.stringify({ type, dataSize: JSON.stringify(data).length }),
        result: JSON.stringify(result),
        cost: result.cost || 0,
        durationMs: Date.now() - startTime,
        status: 'success'
      });

      return {
        success: true,
        insights: result.insights,
        recommendations: result.recommendations,
        provider: providerName,
        metadata: result.metadata
      };

    } catch (err) {
      error = err.message;
      
      // Log failure
      await this.logGeneration({
        userId,
        providerName: providerInstance?.name || provider,
        generationType: 'analysis',
        prompt: JSON.stringify({ type }),
        cost: 0,
        durationMs: Date.now() - startTime,
        status: 'failed',
        errorMessage: error
      });

      throw new Error(`Data analysis failed: ${error}`);
    }
  }

  /**
   * Chat with AI
   * @param {Object} options - Chat options
   * @returns {Promise<Object>} Chat response
   */
  async chat(options) {
    const {
      provider = 'auto',
      message,
      context = {},
      userId,
      apiKey
    } = options;

    const startTime = Date.now();
    let result;
    let error;
    let providerInstance;

    try {
      // Get provider
      providerInstance = await this.getProvider(provider, 'chat', userId);
      const providerName = providerInstance.name;

      // Get API key
      const finalApiKey = apiKey || await this.getApiKey(userId, providerName);

      // Chat
      result = await providerInstance.chat({
        message,
        context,
        apiKey: finalApiKey
      });

      // Log success
      await this.logGeneration({
        userId,
        providerName,
        generationType: 'chat',
        prompt: message,
        result: result.reply,
        cost: result.cost || 0,
        durationMs: Date.now() - startTime,
        status: 'success',
        metadata: { conversationId: context.conversationId }
      });

      return {
        success: true,
        reply: result.reply,
        actions: result.actions || [],
        conversationId: result.conversationId,
        provider: providerName
      };

    } catch (err) {
      error = err.message;
      
      // Log failure
      await this.logGeneration({
        userId,
        providerName: providerInstance?.name || provider,
        generationType: 'chat',
        prompt: message,
        cost: 0,
        durationMs: Date.now() - startTime,
        status: 'failed',
        errorMessage: error
      });

      throw new Error(`Chat failed: ${error}`);
    }
  }

  /**
   * Get API key for a provider
   */
  async getApiKey(userId, providerName) {
    if (!userId) {
      // Return system default from environment
      const envKeys = {
        manus: process.env.MANUS_API_KEY,
        openai: process.env.OPENAI_API_KEY,
        stability: process.env.STABILITY_API_KEY
      };
      return envKeys[providerName];
    }

    // Get user's API key
    const result = await pool.query(
      'SELECT api_key FROM user_ai_settings WHERE user_id = $1 AND provider_name = $2',
      [userId, providerName]
    );

    if (result.rows[0]?.api_key) {
      return result.rows[0].api_key;
    }

    // Fallback to system default
    const envKeys = {
      manus: process.env.MANUS_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      stability: process.env.STABILITY_API_KEY
    };
    return envKeys[providerName];
  }

  /**
   * Log AI generation to database
   */
  async logGeneration(data) {
    try {
      await pool.query(
        `INSERT INTO ai_generation_history 
         (user_id, product_id, provider_name, generation_type, prompt, result, result_url, 
          metadata, cost, duration_ms, status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          data.userId || null,
          data.productId || null,
          data.providerName,
          data.generationType,
          data.prompt || null,
          data.result || null,
          data.resultUrl || null,
          data.metadata || {},
          data.cost || 0,
          data.durationMs || 0,
          data.status || 'success',
          data.errorMessage || null
        ]
      );

      // Update usage stats
      if (data.userId) {
        await this.updateUsageStats(data.userId, data.providerName, data.cost, data.status);
      }
    } catch (err) {
      console.error('Failed to log AI generation:', err);
    }
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats(userId, providerName, cost, status) {
    const today = new Date().toISOString().split('T')[0];
    
    await pool.query(
      `INSERT INTO ai_usage_stats (user_id, provider_name, date, generation_count, total_cost, success_count, failed_count)
       VALUES ($1, $2, $3, 1, $4, $5, $6)
       ON CONFLICT (user_id, provider_name, date) 
       DO UPDATE SET 
         generation_count = ai_usage_stats.generation_count + 1,
         total_cost = ai_usage_stats.total_cost + $4,
         success_count = ai_usage_stats.success_count + $5,
         failed_count = ai_usage_stats.failed_count + $6,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        providerName,
        today,
        cost || 0,
        status === 'success' ? 1 : 0,
        status === 'failed' ? 1 : 0
      ]
    );
  }

  /**
   * Get available providers
   */
  async getAvailableProviders() {
    const result = await pool.query(
      'SELECT * FROM ai_providers WHERE is_enabled = true ORDER BY priority'
    );
    return result.rows;
  }

  /**
   * Get user's AI settings
   */
  async getUserSettings(userId) {
    const result = await pool.query(
      'SELECT * FROM user_ai_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  /**
   * Update user's AI settings
   */
  async updateUserSettings(userId, providerName, settings) {
    const result = await pool.query(
      `INSERT INTO user_ai_settings 
       (user_id, provider_name, api_key, preferences, is_default_image, is_default_text, is_default_analysis, is_default_chat)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, provider_name) 
       DO UPDATE SET 
         api_key = COALESCE($3, user_ai_settings.api_key),
         preferences = COALESCE($4, user_ai_settings.preferences),
         is_default_image = COALESCE($5, user_ai_settings.is_default_image),
         is_default_text = COALESCE($6, user_ai_settings.is_default_text),
         is_default_analysis = COALESCE($7, user_ai_settings.is_default_analysis),
         is_default_chat = COALESCE($8, user_ai_settings.is_default_chat),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        providerName,
        settings.apiKey || null,
        settings.preferences || {},
        settings.isDefaultImage || false,
        settings.isDefaultText || false,
        settings.isDefaultAnalysis || false,
        settings.isDefaultChat || false
      ]
    );
    return result.rows[0];
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(userId, filters = {}) {
    let query = 'SELECT * FROM ai_generation_history WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (filters.providerName) {
      query += ` AND provider_name = $${paramIndex}`;
      params.push(filters.providerName);
      paramIndex++;
    }

    if (filters.generationType) {
      query += ` AND generation_type = $${paramIndex}`;
      params.push(filters.generationType);
      paramIndex++;
    }

    if (filters.productId) {
      query += ` AND product_id = $${paramIndex}`;
      params.push(filters.productId);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId, startDate, endDate) {
    const result = await pool.query(
      `SELECT provider_name, 
              SUM(generation_count) as total_generations,
              SUM(total_cost) as total_cost,
              SUM(success_count) as success_count,
              SUM(failed_count) as failed_count
       FROM ai_usage_stats
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY provider_name
       ORDER BY total_cost DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }
}

module.exports = new AIService();
