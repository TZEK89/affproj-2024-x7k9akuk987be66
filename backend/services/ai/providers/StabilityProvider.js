/**
 * Stability AI Provider
 * Integration with Stability AI for Stable Diffusion image generation
 */

const BaseProvider = require('./BaseProvider');
const axios = require('axios');

class StabilityProvider extends BaseProvider {
  constructor() {
    super('stability');
    this.baseURL = 'https://api.stability.ai/v1';
  }

  /**
   * Generate an image using Stable Diffusion
   */
  async generateImage(options) {
    const { prompt, style, size = '1024x1024', apiKey } = options;

    if (!apiKey) {
      throw new Error('Stability AI API key is required');
    }

    // Parse size
    const [width, height] = size.split('x').map(Number);

    try {
      const response = await axios.post(
        `${this.baseURL}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
        {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: height || 1024,
          width: width || 1024,
          samples: 1,
          steps: 30,
          style_preset: this.mapStyle(style)
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 60000
        }
      );

      // Stability returns base64 image, need to upload to storage
      const imageData = response.data.artifacts[0].base64;
      const imageUrl = await this.uploadImage(imageData);

      return {
        url: imageUrl,
        cost: this.calculateImageCost(width, height),
        metadata: {
          model: 'stable-diffusion-xl-1024-v1-0',
          size: `${width}x${height}`,
          style: style,
          seed: response.data.artifacts[0].seed
        }
      };
    } catch (error) {
      throw new Error(`Stability AI generation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Content generation not supported
   */
  async generateContent(options) {
    throw new Error('Stability AI does not support text generation');
  }

  /**
   * Analysis not supported
   */
  async analyzeData(options) {
    throw new Error('Stability AI does not support data analysis');
  }

  /**
   * Chat not supported
   */
  async chat(options) {
    throw new Error('Stability AI does not support chat');
  }

  /**
   * Test API connection
   */
  async testConnection(apiKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/user/account`,
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
      text: false,
      analysis: false,
      chat: false
    };
  }

  getPricing() {
    return {
      image: 0.01, // $0.01 per image (cheaper than others)
      text: 0,
      analysis: 0,
      chat: 0
    };
  }

  // Helper methods

  mapStyle(style) {
    const styleMap = {
      'photorealistic': 'photographic',
      'artistic': 'digital-art',
      'anime': 'anime',
      '3d': '3d-model',
      'fantasy': 'fantasy-art',
      'cinematic': 'cinematic'
    };
    return styleMap[style] || 'photographic';
  }

  async uploadImage(base64Data) {
    // TODO: Implement image upload to your storage (S3, Cloudinary, etc.)
    // For now, return a placeholder
    // In production, you would:
    // 1. Decode base64
    // 2. Upload to S3/Cloudinary
    // 3. Return public URL
    
    // Temporary: return data URL (not recommended for production)
    return `data:image/png;base64,${base64Data}`;
  }

  calculateImageCost(width, height) {
    // Stability pricing based on resolution
    const megapixels = (width * height) / 1000000;
    return megapixels * 0.01;
  }
}

module.exports = StabilityProvider;
