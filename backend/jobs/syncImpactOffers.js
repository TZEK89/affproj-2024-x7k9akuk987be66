const impactService = require('../services/impactService');
const db = require('../db');

/**
 * Sync offers from Impact.com to our database
 * This job fetches catalogs and their products, then stores them in our products table
 */
class ImpactOfferSync {
  constructor() {
    this.stats = {
      catalogsProcessed: 0,
      productsAdded: 0,
      productsUpdated: 0,
      productsSkipped: 0,
      errors: []
    };
  }

  /**
   * Main sync function
   * @param {Object} options - Sync options
   * @param {boolean} options.fullSync - If true, sync all products. If false, only updated catalogs
   * @param {string} options.campaignId - Optional: only sync specific campaign
   * @param {number} options.maxProducts - Optional: limit number of products to sync (for testing)
   * @returns {Promise<Object>} Sync statistics
   */
  async sync(options = {}) {
    const startTime = Date.now();
    console.log('Starting Impact.com offer sync...');
    
    try {
      // Step 1: Fetch all catalogs
      const catalogs = await impactService.listCatalogs(options.campaignId);
      console.log(`Found ${catalogs.length} catalogs`);

      if (catalogs.length === 0) {
        console.warn('No catalogs found. Make sure you have active partnerships in Impact.com.');
        return this.stats;
      }

      // Step 2: Process each catalog
      for (const catalog of catalogs) {
        try {
          await this.processCatalog(catalog, options);
          this.stats.catalogsProcessed++;
        } catch (error) {
          console.error(`Error processing catalog ${catalog.Id}:`, error.message);
          this.stats.errors.push({
            catalog: catalog.Name,
            error: error.message
          });
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\nSync completed in ${duration}s`);
      console.log(`Catalogs processed: ${this.stats.catalogsProcessed}`);
      console.log(`Products added: ${this.stats.productsAdded}`);
      console.log(`Products updated: ${this.stats.productsUpdated}`);
      console.log(`Products skipped: ${this.stats.productsSkipped}`);
      console.log(`Errors: ${this.stats.errors.length}`);

      return this.stats;
    } catch (error) {
      console.error('Fatal error during sync:', error);
      throw error;
    }
  }

  /**
   * Process a single catalog
   * @param {Object} catalog - Catalog object from Impact.com
   * @param {Object} options - Sync options
   */
  async processCatalog(catalog, options = {}) {
    console.log(`\nProcessing catalog: ${catalog.Name} (${catalog.NumberOfItems} items)`);

    // Build query to filter products
    const query = this.buildProductQuery(options);

    // Fetch products from this catalog
    const products = await impactService.fetchAllCatalogItems(catalog.Id, {
      query,
      pageSize: 200 // Max allowed by Impact.com
    });

    console.log(`Fetched ${products.length} products from ${catalog.Name}`);

    // Apply max products limit if specified (for testing)
    const productsToProcess = options.maxProducts 
      ? products.slice(0, options.maxProducts)
      : products;

    // Store products in database
    for (const product of productsToProcess) {
      try {
        await this.storeProduct(product, catalog);
      } catch (error) {
        console.error(`Error storing product ${product.Id}:`, error.message);
        this.stats.errors.push({
          product: product.Name,
          error: error.message
        });
      }
    }
  }

  /**
   * Build a query string to filter products
   * @param {Object} options - Filter options
   * @returns {string} Query string for Impact.com API
   */
  buildProductQuery(options = {}) {
    const filters = [];

    // Only in-stock products by default
    if (options.inStockOnly !== false) {
      filters.push("StockAvailability = 'InStock'");
    }

    // Only products with images
    if (options.requireImage !== false) {
      filters.push("ImageUrl != ''");
    }

    // Price range filters
    if (options.minPrice) {
      filters.push(`CurrentPrice >= ${options.minPrice}`);
    }
    if (options.maxPrice) {
      filters.push(`CurrentPrice <= ${options.maxPrice}`);
    }

    // Category filter
    if (options.category) {
      filters.push(`Category ~ '${options.category}'`);
    }

    // Only products with promotions
    if (options.withPromotions) {
      filters.push("PromotionIds != null");
    }

    return filters.length > 0 ? filters.join(' AND ') : undefined;
  }

  /**
   * Store or update a product in the database
   * @param {Object} impactProduct - Product from Impact.com
   * @param {Object} catalog - Catalog information
   */
  async storeProduct(impactProduct, catalog) {
    // Transform to our schema
    const product = impactService.transformProduct(impactProduct, catalog);

    // Check if product already exists
    const existingProduct = await db.query(
      'SELECT id, updated_at FROM products WHERE external_id = $1 AND network = $2',
      [product.external_id, 'impact']
    );

    if (existingProduct.rows.length > 0) {
      // Update existing product
      await db.query(`
        UPDATE products 
        SET 
          name = $1,
          description = $2,
          price = $3,
          original_price = $4,
          currency = $5,
          image_url = $6,
          product_url = $7,
          category = $8,
          subcategory = $9,
          network_name = $10,
          advertiser_name = $11,
          stock_status = $12,
          metadata = $13,
          updated_at = CURRENT_TIMESTAMP
        WHERE external_id = $14 AND network = $15
      `, [
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.currency,
        product.image_url,
        product.product_url,
        product.category,
        product.subcategory,
        product.network_name,
        product.advertiser_name,
        product.stock_status,
        JSON.stringify(product.metadata),
        product.external_id,
        'impact'
      ]);

      this.stats.productsUpdated++;
    } else {
      // Insert new product
      await db.query(`
        INSERT INTO products (
          external_id, name, description, price, original_price, currency,
          image_url, product_url, category, subcategory, network, network_id,
          network_name, advertiser_name, stock_status, commission_rate,
          commission_type, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        product.external_id,
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.currency,
        product.image_url,
        product.product_url,
        product.category,
        product.subcategory,
        product.network,
        product.network_id,
        product.network_name,
        product.advertiser_name,
        product.stock_status,
        product.commission_rate,
        product.commission_type,
        JSON.stringify(product.metadata)
      ]);

      this.stats.productsAdded++;
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

module.exports = ImpactOfferSync;
