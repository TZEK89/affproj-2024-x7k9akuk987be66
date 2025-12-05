/**
 * Base Provider Interface
 * All AI providers must implement this interface
 */

class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generate an image from a text prompt
   * @param {Object} options - Generation options
   * @param {string} options.prompt - Text prompt
   * @param {string} options.style - Style preference
   * @param {string} options.size - Image size
   * @param {string} options.apiKey - API key
   * @returns {Promise<Object>} { url, cost, metadata }
   */
  async generateImage(options) {
    throw new Error('generateImage() must be implemented by provider');
  }

  /**
   * Generate text content
   * @param {Object} options - Generation options
   * @param {string} options.type - Content type
   * @param {Object} options.context - Context data
   * @param {string} options.length - Content length
   * @param {string} options.tone - Writing tone
   * @param {string} options.apiKey - API key
   * @returns {Promise<Object>} { content, cost, metadata }
   */
  async generateContent(options) {
    throw new Error('generateContent() must be implemented by provider');
  }

  /**
   * Analyze data
   * @param {Object} options - Analysis options
   * @param {string} options.type - Analysis type
   * @param {Object} options.data - Data to analyze
   * @param {string} options.apiKey - API key
   * @returns {Promise<Object>} { insights, recommendations, cost, metadata }
   */
  async analyzeData(options) {
    throw new Error('analyzeData() must be implemented by provider');
  }

  /**
   * Chat with AI
   * @param {Object} options - Chat options
   * @param {string} options.message - User message
   * @param {Object} options.context - Conversation context
   * @param {string} options.apiKey - API key
   * @returns {Promise<Object>} { reply, actions, conversationId, cost, metadata }
   */
  async chat(options) {
    throw new Error('chat() must be implemented by provider');
  }

  /**
   * Test API connection
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection(apiKey) {
    throw new Error('testConnection() must be implemented by provider');
  }

  /**
   * Get provider capabilities
   * @returns {Object} Capabilities object
   */
  getCapabilities() {
    return {
      image: false,
      text: false,
      analysis: false,
      chat: false
    };
  }

  /**
   * Get pricing information
   * @returns {Object} Pricing object
   */
  getPricing() {
    return {
      image: 0,
      text: 0,
      analysis: 0,
      chat: 0
    };
  }
}

module.exports = BaseProvider;
