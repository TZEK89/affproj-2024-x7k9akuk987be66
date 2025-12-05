/**
 * OpenAI Provider
 * Integration with OpenAI API for DALL-E 3 and GPT-4
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class OpenAIProvider extends BaseProvider {
  constructor() {
    super('openai');
    this.baseURL = 'https://api.openai.com/v1';
  }

  /**
   * Generate an image using DALL-E 3
   */
  async generateImage(options) {
    const { prompt, size = '1024x1024', apiKey } = options;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/images/generations`,
        {
          model: 'dall-e-3',
          prompt,
          size,
          quality: 'standard',
          n: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        url: response.data.data[0].url,
        cost: this.calculateImageCost(size),
        metadata: {
          model: 'dall-e-3',
          size,
          revised_prompt: response.data.data[0].revised_prompt
        }
      };
    } catch (error) {
      throw new Error(`OpenAI image generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Generate content using GPT-4
   */
  async generateContent(options) {
    const { type, context, length = 'medium', tone = 'professional', apiKey } = options;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const prompt = this.buildContentPrompt(type, context, length, tone);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert affiliate marketing copywriter.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: this.getMaxTokens(length)
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const content = response.data.choices[0].message.content;

      return {
        content,
        cost: this.calculateTextCost(response.data.usage.total_tokens),
        metadata: {
          model: 'gpt-4',
          type,
          tokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`OpenAI content generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Analyze data using GPT-4
   */
  async analyzeData(options) {
    const { type, data, apiKey } = options;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const prompt = `Analyze this ${type} data and provide insights:\n\n${JSON.stringify(data, null, 2)}\n\nProvide insights and recommendations in JSON format.`;

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a data analyst. Provide insights in JSON format with "insights" and "recommendations" arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const analysis = response.data.choices[0].message.content;
      const parsed = JSON.parse(analysis);

      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        cost: this.calculateTextCost(response.data.usage.total_tokens),
        metadata: {
          model: 'gpt-4',
          tokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`OpenAI analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Chat using GPT-4
   */
  async chat(options) {
    const { message, context = {}, apiKey } = options;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant for affiliate marketing.'
      }
    ];

    if (context.history) {
      messages.push(...context.history);
    }

    messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const reply = response.data.choices[0].message.content;

      return {
        reply,
        actions: [],
        conversationId: context.conversationId || `conv_${Date.now()}`,
        cost: this.calculateTextCost(response.data.usage.total_tokens),
        metadata: {
          model: 'gpt-4',
          tokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`OpenAI chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(apiKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/models`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000
        }
      );
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getCapabilities() {
    return {
      image: true,
      text: true,
      analysis: true,
      chat: true
    };
  }

  getPricing() {
    return {
      image: 0.04, // $0.04 per DALL-E 3 image
      text: 0.03, // $0.03 per 1K tokens (GPT-4)
      analysis: 0.03,
      chat: 0.03
    };
  }

  // Helper methods
  buildContentPrompt(type, context, length, tone) {
    return `Write ${tone} ${type} content for ${context.productName}. Length: ${length}. Context: ${JSON.stringify(context)}`;
  }

  getMaxTokens(length) {
    return { short: 200, medium: 500, long: 1000 }[length] || 500;
  }

  calculateImageCost(size) {
    return 0.04; // DALL-E 3 standard pricing
  }

  calculateTextCost(tokens) {
    return (tokens / 1000) * 0.03; // GPT-4 pricing
  }
}

module.exports = OpenAIProvider;
