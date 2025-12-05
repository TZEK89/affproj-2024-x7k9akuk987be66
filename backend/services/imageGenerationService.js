const OpenAI = require('openai');

/**
 * Image Generation Service
 * Uses DALL-E 3 to generate professional product cover images
 */
class ImageGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate a product cover image using DALL-E 3
   * @param {Object} product - Product information
   * @param {string} product.name - Product name
   * @param {string} product.format - Product format (EBOOK, ONLINE_COURSE, etc.)
   * @param {string} product.description - Product description (optional)
   * @param {string} customPrompt - Custom prompt override (optional)
   * @returns {Promise<Object>} Generated image data
   */
  async generateProductCover(product, customPrompt = null) {
    try {
      // Build the prompt
      const prompt = customPrompt || this.buildPrompt(product);

      console.log('Generating image with prompt:', prompt);

      // Generate image using DALL-E 3
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid' // or 'natural' for more realistic images
      });

      const imageUrl = response.data[0].url;
      const revisedPrompt = response.data[0].revised_prompt;

      console.log('Image generated successfully:', imageUrl);

      return {
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        revisedPrompt: revisedPrompt,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Build a prompt for product cover image generation
   * @param {Object} product - Product information
   * @returns {string} Generated prompt
   */
  buildPrompt(product) {
    const formatDescriptions = {
      'EBOOK': 'professional ebook cover design',
      'ONLINE_COURSE': 'modern online course thumbnail',
      'SOFTWARE': 'sleek software product icon',
      'MOBILE_APPS': 'mobile app icon design',
      'VIDEOS': 'video course cover image',
      'AUDIOS': 'podcast or audio course cover',
      'TEMPLATES': 'template pack preview',
      'IMAGES': 'image pack preview',
      'ONLINE_SERVICE': 'service offering banner',
      'ONLINE_EVENT': 'event poster design',
      'BUNDLE': 'product bundle showcase',
      'COMMUNITY': 'community platform banner',
      'AGENT': 'agent service banner'
    };

    const formatDesc = formatDescriptions[product.format] || 'professional product cover';

    // Build prompt with product details
    let prompt = `Create a ${formatDesc} for a product called "${product.name}". `;
    
    // Add description if available
    if (product.description) {
      prompt += `The product is about: ${product.description.substring(0, 200)}. `;
    }

    // Add style guidelines
    prompt += `Style: modern, professional, eye-catching, high quality, commercial design. `;
    prompt += `Use vibrant colors, clear typography, and make it suitable for digital marketing. `;
    prompt += `No text on the image, just visual design elements.`;

    return prompt;
  }

  /**
   * Generate multiple variations of a product cover
   * @param {Object} product - Product information
   * @param {number} count - Number of variations (max 4)
   * @returns {Promise<Array>} Array of generated images
   */
  async generateVariations(product, count = 3) {
    const variations = [];
    
    for (let i = 0; i < Math.min(count, 4); i++) {
      try {
        const result = await this.generateProductCover(product);
        variations.push(result);
        
        // Add delay to avoid rate limiting
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Generate a placeholder image URL based on product format
   * @param {string} format - Product format
   * @returns {string} Placeholder image URL
   */
  getPlaceholderImage(format) {
    const placeholders = {
      'EBOOK': 'https://via.placeholder.com/400x600/4A90E2/ffffff?text=eBook',
      'ONLINE_COURSE': 'https://via.placeholder.com/1200x675/7B68EE/ffffff?text=Online+Course',
      'SOFTWARE': 'https://via.placeholder.com/512x512/32CD32/ffffff?text=Software',
      'MOBILE_APPS': 'https://via.placeholder.com/512x512/FF6347/ffffff?text=Mobile+App',
      'VIDEOS': 'https://via.placeholder.com/1920x1080/FF1493/ffffff?text=Video',
      'AUDIOS': 'https://via.placeholder.com/1000x1000/9370DB/ffffff?text=Audio',
      'TEMPLATES': 'https://via.placeholder.com/800x600/20B2AA/ffffff?text=Templates',
      'IMAGES': 'https://via.placeholder.com/1000x1000/FFD700/ffffff?text=Images',
      'ONLINE_SERVICE': 'https://via.placeholder.com/1200x630/1E90FF/ffffff?text=Service',
      'ONLINE_EVENT': 'https://via.placeholder.com/1920x1080/FF4500/ffffff?text=Event',
      'BUNDLE': 'https://via.placeholder.com/1000x1000/8A2BE2/ffffff?text=Bundle',
      'COMMUNITY': 'https://via.placeholder.com/1200x630/00CED1/ffffff?text=Community',
      'AGENT': 'https://via.placeholder.com/1200x630/DC143C/ffffff?text=Agent'
    };

    return placeholders[format] || 'https://via.placeholder.com/800x600/808080/ffffff?text=Product';
  }
}

module.exports = ImageGenerationService;
