/**
 * Manus AI Provider
 * Integration with Manus AI API for image generation, content creation, analysis, and chat
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class ManusProvider extends BaseProvider {
  constructor() {
    super('manus');
    this.baseURL = process.env.MANUS_API_URL || 'https://api.manus.im/v1';
  }

  /**
   * Generate an image using Manus AI (Nano Banana)
   */
  async generateImage(options) {
    const { prompt, style = 'photorealistic', size = '1024x1024', apiKey } = options;

    if (!apiKey) {
      throw new Error('Manus API key is required');
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/images/generate`,
        {
          prompt,
          style,
          size,
          model: 'nano-banana'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      return {
        url: response.data.url || response.data.image_url,
        cost: this.calculateImageCost(size),
        metadata: {
          model: 'nano-banana',
          style,
          size,
          revised_prompt: response.data.revised_prompt
        }
      };
    } catch (error) {
      throw new Error(`Manus image generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Generate content using Manus AI
   */
  async generateContent(options) {
    const { type, context, length = 'medium', tone = 'professional', apiKey } = options;

    if (!apiKey) {
      throw new Error('Manus API key is required');
    }

    // Build prompt based on type
    const prompt = this.buildContentPrompt(type, context, length, tone);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4.1-mini', // Using Manus-hosted model
          messages: [
            {
              role: 'system',
              content: 'You are an expert affiliate marketing copywriter. Generate compelling, conversion-focused content.'
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
        cost: this.calculateTextCost(content.length),
        metadata: {
          model: 'gpt-4.1-mini',
          type,
          length,
          tone,
          tokens: response.data.usage?.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`Manus content generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Analyze data using Manus AI
   */
  async analyzeData(options) {
    const { type, data, apiKey } = options;

    if (!apiKey) {
      throw new Error('Manus API key is required');
    }

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(type, data);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a data analyst specializing in affiliate marketing. Provide actionable insights and recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more factual analysis
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
      
      // Parse the analysis into insights and recommendations
      const parsed = this.parseAnalysis(analysis);

      return {
        insights: parsed.insights,
        recommendations: parsed.recommendations,
        cost: this.calculateTextCost(analysis.length),
        metadata: {
          model: 'gpt-4.1-mini',
          type,
          tokens: response.data.usage?.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`Manus data analysis failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Chat with Manus AI
   */
  async chat(options) {
    const { message, context = {}, apiKey } = options;

    if (!apiKey) {
      throw new Error('Manus API key is required');
    }

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: 'You are Manus, an AI assistant for affiliate marketing. Help users manage products, generate content, analyze data, and automate tasks. Be helpful, concise, and action-oriented.'
      }
    ];

    // Add conversation history if available
    if (context.history && Array.isArray(context.history)) {
      messages.push(...context.history);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4.1-mini',
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
      
      // Extract any actions from the reply
      const actions = this.extractActions(reply);

      return {
        reply,
        actions,
        conversationId: context.conversationId || this.generateConversationId(),
        cost: this.calculateTextCost(reply.length),
        metadata: {
          model: 'gpt-4.1-mini',
          tokens: response.data.usage?.total_tokens
        }
      };
    } catch (error) {
      throw new Error(`Manus chat failed: ${error.response?.data?.message || error.message}`);
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

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      image: true,
      text: true,
      analysis: true,
      chat: true,
      batch: true,
      streaming: true
    };
  }

  /**
   * Get pricing information (per unit)
   */
  getPricing() {
    return {
      image: 0.02, // $0.02 per image
      text: 0.001, // $0.001 per 1000 characters
      analysis: 0.002, // $0.002 per analysis
      chat: 0.001 // $0.001 per message
    };
  }

  // Helper methods

  buildContentPrompt(type, context, length, tone) {
    const lengthGuide = {
      short: '50-100 words',
      medium: '150-300 words',
      long: '400-600 words'
    };

    const prompts = {
      description: `Write a ${tone} product description (${lengthGuide[length]}) for:\n\nProduct: ${context.productName}\nDetails: ${context.productDetails || 'N/A'}\nTarget Audience: ${context.targetAudience || 'General'}\n\nMake it compelling and conversion-focused.`,
      
      marketing: `Write ${tone} marketing copy (${lengthGuide[length]}) for:\n\nProduct: ${context.productName}\nKey Benefits: ${context.benefits || 'N/A'}\nTarget Audience: ${context.targetAudience || 'General'}\n\nFocus on benefits and create urgency.`,
      
      email: `Write a ${tone} email campaign (${lengthGuide[length]}) for:\n\nProduct: ${context.productName}\nOffer: ${context.offer || 'N/A'}\nTarget Audience: ${context.targetAudience || 'General'}\n\nInclude subject line and body.`,
      
      blog: `Write a ${tone} blog post (${lengthGuide[length]}) about:\n\nTopic: ${context.topic || context.productName}\nKey Points: ${context.keyPoints || 'N/A'}\nTarget Audience: ${context.targetAudience || 'General'}\n\nMake it informative and engaging.`
    };

    return prompts[type] || prompts.description;
  }

  buildAnalysisPrompt(type, data) {
    const prompts = {
      performance: `Analyze the following product performance data and provide insights:\n\n${JSON.stringify(data, null, 2)}\n\nProvide:\n1. Key insights (3-5 points)\n2. Recommendations (3-5 actionable items)\n\nFormat as JSON with "insights" and "recommendations" arrays.`,
      
      trends: `Analyze the following trend data:\n\n${JSON.stringify(data, null, 2)}\n\nIdentify:\n1. Key trends\n2. Opportunities\n3. Risks\n\nFormat as JSON with "insights" and "recommendations" arrays.`,
      
      optimization: `Analyze this data for optimization opportunities:\n\n${JSON.stringify(data, null, 2)}\n\nProvide:\n1. Current performance insights\n2. Optimization recommendations\n\nFormat as JSON with "insights" and "recommendations" arrays.`
    };

    return prompts[type] || prompts.performance;
  }

  parseAnalysis(analysis) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(analysis);
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || []
      };
    } catch {
      // If not JSON, extract insights and recommendations from text
      const insights = [];
      const recommendations = [];

      const lines = analysis.split('\n');
      let currentSection = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toLowerCase().includes('insight')) {
          currentSection = 'insights';
        } else if (trimmed.toLowerCase().includes('recommendation')) {
          currentSection = 'recommendations';
        } else if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
          const text = trimmed.replace(/^[-•\d.]\s*/, '');
          if (currentSection === 'insights') {
            insights.push(text);
          } else if (currentSection === 'recommendations') {
            recommendations.push(text);
          }
        }
      }

      return { insights, recommendations };
    }
  }

  extractActions(reply) {
    // Extract action commands from AI reply
    // Format: [ACTION:type:params]
    const actions = [];
    const regex = /\[ACTION:(\w+):([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(reply)) !== null) {
      actions.push({
        type: match[1],
        params: match[2]
      });
    }

    return actions;
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMaxTokens(length) {
    const tokens = {
      short: 200,
      medium: 500,
      long: 1000
    };
    return tokens[length] || 500;
  }

  calculateImageCost(size) {
    // Manus pricing: $0.02 per image
    return 0.02;
  }

  calculateTextCost(characterCount) {
    // Manus pricing: $0.001 per 1000 characters
    return (characterCount / 1000) * 0.001;
  }
}

module.exports = ManusProvider;
