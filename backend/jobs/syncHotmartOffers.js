const HotmartService = require('../services/hotmartService');
const ImageGenerationService = require('../services/imageGenerationService');
const db = require('../db');

/**
 * Sync products from Hotmart to local database
 * 
 * This job fetches all available products from Hotmart and stores them
 * in the products table, avoiding duplicates.
 * Automatically generates product cover images using DALL-E 3.
 */
class HotmartSyncJob {
  constructor() {
    this.hotmart = new HotmartService();
    this.imageService = new ImageGenerationService();
    this.stats = {
      total: 0,
      new: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      imagesGenerated: 0
    };
  }

  /**
   * Run the sync job
   * @param {Object} options - Sync options
   * @param {boolean} options.generateImages - Whether to generate images (default: true)
   * @param {number} options.batchSize - Number of products per page (default: 50)
   * @returns {Promise<Object>} Sync statistics
   */
  async run(options = {}) {
    console.log('🚀 Starting Hotmart product sync...');
    const startTime = Date.now();
    const generateImages = options.generateImages !== false; // Default to true

    try {
      // Reset stats
      this.stats = { total: 0, new: 0, updated: 0, skipped: 0, errors: 0, imagesGenerated: 0 };

      // Fetch products with pagination
      let pageToken = null;
      let hasMore = true;

      while (hasMore) {
        try {
          const response = await this.hotmart.getProducts({
            maxResults: options.batchSize || 50,
            pageToken
          });

          if (response.items && response.items.length > 0) {
            await this.processProducts(response.items, generateImages);
          }

          // Check if there are more pages
          pageToken = response.page_info?.next_page_token;
          hasMore = !!pageToken;

          console.log(`📄 Processed page, total so far: ${this.stats.total}`);

        } catch (error) {
          console.error('❌ Error fetching products page:', error.message);
          this.stats.errors++;
          break; // Stop pagination on error
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log('✅ Hotmart sync complete!');
      console.log(`📊 Stats: ${this.stats.new} new, ${this.stats.updated} updated, ${this.stats.skipped} skipped, ${this.stats.errors} errors`);
      console.log(`🎨 AI-generated images: ${this.stats.imagesGenerated}`);
      console.log(`⏱️  Duration: ${duration}s`);

      return {
        success: true,
        stats: this.stats,
        duration: parseFloat(duration),
        message: `Synced ${this.stats.new} new products with ${this.stats.imagesGenerated} AI-generated images`
      };

    } catch (error) {
      console.error('❌ Hotmart sync failed:', error.message);
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Process a batch of products
   * @param {Array} products - Array of Hotmart products
   * @param {boolean} generateImages - Whether to generate images
   */
  async processProducts(products, generateImages) {
    for (const product of products) {
      try {
        await this.processProduct(product, generateImages);
      } catch (error) {
        console.error(`❌ Error processing product ${product.id}:`, error.message);
        this.stats.errors++;
      }
    }
  }

  /**
   * Process a single product
   * @param {Object} hotmartProduct - Product data from Hotmart
   * @param {boolean} generateImages - Whether to generate images
   */
  async processProduct(hotmartProduct, generateImages) {
    this.stats.total++;

    // Transform to our schema
    const product = this.hotmart.transformProduct(hotmartProduct);

    // Check if product already exists
    const existing = await db.query(
      'SELECT id, image_url FROM products WHERE network = $1 AND network_id = $2',
      ['hotmart', product.network_id]
    );

    if (existing.rows.length > 0) {
      // Update existing product (don't regenerate image)
      await db.query(
        `UPDATE products 
         SET name = $1, description = $2, price = $3, original_price = $4,
             currency = $5, product_url = $6, category = $7,
             advertiser_name = $8, commission_rate = $9, stock_status = $10,
             metadata = $11, updated_at = NOW()
         WHERE network = $12 AND network_id = $13`,
        [
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.currency,
          product.product_url,
          product.category,
          product.advertiser_name,
          product.commission_rate,
          product.stock_status,
          JSON.stringify(product.metadata),
          'hotmart',
          product.network_id
        ]
      );
      this.stats.updated++;
      console.log(`✏️  Updated: ${product.name}`);
    } else {
      // Generate product cover image for new products
      let imageUrl = null;
      
      if (generateImages) {
        try {
          console.log(`🎨 Generating image for: ${product.name}...`);
          const imageResult = await this.imageService.generateProductCover({
            name: product.name,
            format: hotmartProduct.format || 'ONLINE_COURSE',
            description: product.description
          });
          imageUrl = imageResult.imageUrl;
          this.stats.imagesGenerated++;
          console.log(`✨ Image generated successfully`);
        } catch (error) {
          console.error(`⚠️  Failed to generate image: ${error.message}`);
          // Use placeholder if generation fails
          imageUrl = this.imageService.getPlaceholderImage(hotmartProduct.format || 'ONLINE_COURSE');
        }
      } else {
        // Use placeholder if image generation is disabled
        imageUrl = this.imageService.getPlaceholderImage(hotmartProduct.format || 'ONLINE_COURSE');
      }

      // Insert new product with generated image
      await db.query(
        `INSERT INTO products (
          external_id, name, description, price, original_price, currency,
          image_url, product_url, category, network, network_id, network_name,
          advertiser_name, commission_rate, stock_status, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          product.external_id,
          product.name,
          product.description,
          product.price,
          product.original_price,
          product.currency,
          imageUrl,
          product.product_url,
          product.category,
          product.network,
          product.network_id,
          product.network_name,
          product.advertiser_name,
          product.commission_rate,
          product.stock_status,
          JSON.stringify(product.metadata)
        ]
      );
      this.stats.new++;
      console.log(`✨ Added: ${product.name}`);
    }
  }

  /**
   * Sync a specific product by ID
   * @param {number} productId - Hotmart product ID
   * @param {boolean} regenerateImage - Whether to regenerate the image
   * @returns {Promise<Object>} Sync result
   */
  async syncProduct(productId, regenerateImage = false) {
    try {
      const product = await this.hotmart.getProduct(productId);
      await this.processProduct(product, regenerateImage);
      
      return {
        success: true,
        message: `Product ${productId} synced successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get sync statistics
   * @returns {Object} Current sync stats
   */
  getStats() {
    return this.stats;
  }
}

module.exports = HotmartSyncJob;
