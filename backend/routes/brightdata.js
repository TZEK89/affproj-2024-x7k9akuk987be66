/**
 * Bright Data API Routes
 * Exposes scraping capabilities via REST API
 */

const express = require('express');
const router = express.Router();

// Get the global Bright Data service instance
const getBrightDataService = () => {
  if (!global.BrightDataService) {
    throw new Error('Bright Data service not initialized');
  }
  return global.BrightDataService;
};

/**
 * GET /api/brightdata/health
 * Get service health and status
 */
router.get('/health', async (req, res) => {
  try {
    const service = getBrightDataService();
    const health = service.getStats();
    res.json({
      status: 'healthy',
      initialized: service.initialized,
      ...health
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

/**
 * GET /api/brightdata/test
 * Test Bright Data API connection
 */
router.get('/test', async (req, res) => {
  try {
    const service = getBrightDataService();
    const result = await service.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/brightdata/stats
 * Get usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const service = getBrightDataService();
    const stats = service.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/brightdata/stats/reset
 * Reset usage statistics
 */
router.post('/stats/reset', async (req, res) => {
  try {
    const service = getBrightDataService();
    service.resetStats();
    res.json({ success: true, message: 'Statistics reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/brightdata/fetch
 * Fetch a URL using Web Unlocker
 */
router.post('/fetch', async (req, res) => {
  try {
    const { url, format = 'raw', country = 'us' } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL is required' 
      });
    }
    
    const service = getBrightDataService();
    const result = await service.webUnlockerFetch(url, { format, country });
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/brightdata/fetch/markdown
 * Fetch URL as clean markdown
 */
router.post('/fetch/markdown', async (req, res) => {
  try {
    const { url, country = 'us' } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'URL is required' 
      });
    }
    
    const service = getBrightDataService();
    const result = await service.fetchAsMarkdown(url, { country });
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/brightdata/search
 * Search using SERP API
 */
router.post('/search', async (req, res) => {
  try {
    const { query, engine = 'google', numResults = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query is required' 
      });
    }
    
    const service = getBrightDataService();
    const result = await service.search(query, { engine, numResults });
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/brightdata/hotmart/search
 * Search Hotmart marketplace - THE MAIN ENDPOINT!
 */
router.post('/hotmart/search', async (req, res) => {
  try {
    const { query, screenshot = false } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query is required' 
      });
    }
    
    console.log(`[API] Hotmart search request for: "${query}"`);
    
    const service = getBrightDataService();
    const result = await service.scrapeHotmartMarketplace(query, { screenshot });
    
    console.log(`[API] Hotmart search completed. Found ${result.data?.totalFound || 0} products`);
    
    res.json(result);
  } catch (error) {
    console.error('[API] Hotmart search error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * POST /api/brightdata/hotmart/product
 * Get details of a specific Hotmart product
 */
router.post('/hotmart/product', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: 'Product URL is required' 
      });
    }
    
    const service = getBrightDataService();
    const result = await service.scrapeHotmartProduct(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
