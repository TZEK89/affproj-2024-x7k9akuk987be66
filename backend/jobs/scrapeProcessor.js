// backend/jobs/scrapeProcessor.js

/**
 * Scrape Job Processor
 *
 * Handles marketplace scraping jobs using the scraper infrastructure.
 * Integrates with the existing BullMQ job system.
 */

const { Worker } = require('bullmq');
const ScraperFactory = require('../services/scraping/ScraperFactory');
const MarketplaceService = require('../services/marketplace/MarketplaceService');
const db = require('../db');

// Job processor function
const processScrapeJob = async (job) => {
  const {
    sessionId,
    marketplaceId,
    userId,
    config
  } = job.data;

  console.log(`[ScrapeWorker] Starting job ${job.id} for marketplace ${marketplaceId}`);

  try {
    // Update session status
    await MarketplaceService.updateSession(sessionId, {
      status: 'running',
      started_at: new Date()
    });

    // Get marketplace details
    const marketplace = await MarketplaceService.getById(marketplaceId);
    if (!marketplace) {
      throw new Error('Marketplace not found');
    }

    // Get decrypted scraper config
    const scraperConfig = await MarketplaceService.getDecryptedConfig(marketplaceId);

    // Create scraper
    const scraper = ScraperFactory.create(config.scraperType || 'playwright', {
      ...scraperConfig,
      maxProducts: config.maxProducts || 100
    });

    // Track products
    const products = [];
    const logs = [];

    // Handle scraper events
    scraper.on('progress', async (progress) => {
      try {
        await MarketplaceService.updateSession(sessionId, {
          progress: progress.progress,
          products_found: progress.current
        });
        job.updateProgress(progress.progress);
      } catch (e) {
        console.error('[ScrapeWorker] Failed to update progress:', e.message);
      }
    });

    scraper.on('product', (product) => {
      products.push(product);
    });

    scraper.on('log', (log) => {
      logs.push(log);
    });

    // Run scrape
    await scraper.scrape({
      url: config.url || marketplace.base_url,
      platform: marketplace.platform,
      marketplaceId: parseInt(marketplaceId),
      maxProducts: config.maxProducts || marketplace.max_products
    });

    // Update session with logs
    await MarketplaceService.updateSession(sessionId, { logs });

    // Save products to database
    let newCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      try {
        // Check if product exists (by URL)
        const existingResult = await db.query(
          'SELECT id FROM products WHERE product_url = $1',
          [product.product_url]
        );

        if (existingResult.rows.length > 0) {
          // Update existing
          await db.query(`
            UPDATE products SET
              name = $1,
              description = $2,
              price = $3,
              currency = $4,
              image_url = $5,
              temperature = $6,
              gravity = $7,
              category = $8,
              marketplace_id = $9,
              scrape_session_id = $10,
              scraped_at = $11,
              updated_at = NOW()
            WHERE id = $12
          `, [
            product.name,
            product.description,
            product.price,
            product.currency,
            product.image_url,
            product.temperature,
            product.gravity,
            product.category,
            marketplaceId,
            sessionId,
            new Date(),
            existingResult.rows[0].id
          ]);
          updatedCount++;
        } else {
          // Insert new
          await db.query(`
            INSERT INTO products (
              user_id, name, description, price, currency, image_url,
              product_url, network, temperature, gravity, category,
              marketplace_id, scrape_session_id, scraped_at, stage,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          `, [
            userId,
            product.name,
            product.description,
            product.price,
            product.currency || 'USD',
            product.image_url,
            product.product_url,
            product.platform,
            product.temperature,
            product.gravity,
            product.category,
            marketplaceId,
            sessionId,
            new Date(),
            'discovery'
          ]);
          newCount++;
        }
      } catch (e) {
        console.error('[ScrapeWorker] Failed to save product:', e.message);
      }
    }

    // Calculate duration
    const startTime = job.timestamp;
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update session completion
    await MarketplaceService.updateSession(sessionId, {
      status: 'completed',
      completed_at: new Date(),
      duration_seconds: duration,
      products_found: products.length,
      products_new: newCount,
      products_updated: updatedCount
    });

    // Get total products count for this marketplace
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE marketplace_id = $1',
      [marketplaceId]
    );
    const totalProducts = parseInt(countResult.rows[0].count);

    // Update marketplace stats
    await MarketplaceService.updateScrapeStats(marketplaceId, {
      duration,
      productsCount: totalProducts
    });

    console.log(`[ScrapeWorker] Job ${job.id} complete: ${newCount} new, ${updatedCount} updated`);

    return {
      success: true,
      productsFound: products.length,
      newCount,
      updatedCount,
      duration
    };

  } catch (error) {
    console.error(`[ScrapeWorker] Job ${job.id} failed:`, error);

    // Update session with error
    await MarketplaceService.updateSession(sessionId, {
      status: 'failed',
      completed_at: new Date(),
      error_message: error.message
    });

    // Update marketplace status
    await MarketplaceService.updateStatus(marketplaceId, 'error', error.message);

    throw error;
  }
};

/**
 * Create the scrape worker
 */
const createScrapeWorker = (connection) => {
  if (!connection) {
    console.warn('[ScrapeWorker] No Redis connection, worker not started');
    return null;
  }

  const worker = new Worker('marketplace-scrape', processScrapeJob, {
    connection,
    concurrency: 2, // Process 2 jobs at a time
    limiter: {
      max: 5,
      duration: 60000 // Max 5 jobs per minute to avoid rate limits
    }
  });

  worker.on('completed', (job, result) => {
    console.log(`[ScrapeWorker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, error) => {
    console.error(`[ScrapeWorker] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[ScrapeWorker] Worker error:', error);
  });

  console.log('✅ Scrape worker started');
  return worker;
};

module.exports = {
  processScrapeJob,
  createScrapeWorker
};
