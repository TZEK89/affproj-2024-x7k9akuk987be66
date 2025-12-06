/**
 * Browser Controller API
 * 
 * This module provides HTTP endpoints that allow AI assistants (like Claude)
 * to directly control browser automation. Think of it as an "MCP server over HTTP".
 * 
 * The AI can call these endpoints to:
 * 1. Start a browser session
 * 2. Login to platforms (Hotmart, etc.)
 * 3. Search marketplaces
 * 4. Extract product data
 * 5. Take screenshots
 * 6. Close sessions
 * 
 * This enables TRUE agentic behavior where the AI:
 * - Decides what action to take
 * - Calls the appropriate endpoint
 * - Observes the result
 * - Decides the next action
 * - Repeats until goal is achieved
 */

const express = require('express');
const router = express.Router();

// Import browser automation classes
let HotmartAutomation = null;
let BrowserService = null;

try {
  HotmartAutomation = require('../services/browser/HotmartAutomation');
  BrowserService = require('../services/browser/BrowserService');
  console.log('✅ Browser automation loaded for controller');
} catch (error) {
  console.warn('⚠️ Browser automation not available:', error.message);
}

// Store active browser sessions (in production, use Redis)
const activeSessions = new Map();

/**
 * Generate unique session ID
 */
const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get session or throw error
 */
const getSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found. Start a new session first.`);
  }
  return session;
};

/**
 * POST /api/browser/session/start
 * Start a new browser session
 * 
 * Request: { platform: "hotmart" }
 * Response: { sessionId: "session-xxx", status: "ready" }
 */
router.post('/session/start', async (req, res) => {
  try {
    const { platform = 'hotmart' } = req.body;
    
    if (!HotmartAutomation) {
      return res.status(503).json({
        success: false,
        error: 'Browser automation not available on this server'
      });
    }
    
    const sessionId = generateSessionId();
    let browser;
    
    // Create platform-specific browser instance
    switch (platform.toLowerCase()) {
      case 'hotmart':
        browser = new HotmartAutomation();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported platform: ${platform}. Supported: hotmart`
        });
    }
    
    // Launch browser
    console.log(`🚀 Starting browser session: ${sessionId}`);
    await browser.launch();
    
    // Store session
    activeSessions.set(sessionId, {
      id: sessionId,
      platform,
      browser,
      createdAt: new Date(),
      lastActivity: new Date(),
      isLoggedIn: false,
      currentPage: null
    });
    
    res.json({
      success: true,
      sessionId,
      platform,
      status: 'ready',
      message: 'Browser session started. You can now login or navigate.',
      availableActions: [
        'POST /api/browser/hotmart/login - Login to Hotmart',
        'POST /api/browser/hotmart/search - Search marketplace',
        'POST /api/browser/hotmart/extract - Extract products from current page',
        'POST /api/browser/screenshot - Take screenshot',
        'POST /api/browser/session/end - Close session'
      ]
    });
    
  } catch (error) {
    console.error('Session start error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/session/end
 * End a browser session
 * 
 * Request: { sessionId: "session-xxx" }
 */
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId required' });
    }
    
    const session = activeSessions.get(sessionId);
    
    if (session) {
      await session.browser.close();
      activeSessions.delete(sessionId);
      console.log(`🛑 Session ended: ${sessionId}`);
    }
    
    res.json({
      success: true,
      message: `Session ${sessionId} closed`
    });
    
  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/browser/sessions
 * List active sessions
 */
router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(s => ({
    id: s.id,
    platform: s.platform,
    createdAt: s.createdAt,
    lastActivity: s.lastActivity,
    isLoggedIn: s.isLoggedIn,
    currentPage: s.currentPage
  }));
  
  res.json({ success: true, sessions, count: sessions.length });
});

/**
 * POST /api/browser/hotmart/login
 * Login to Hotmart
 * 
 * Request: { sessionId: "session-xxx", email: "...", password: "..." }
 * Response: { success: true, isLoggedIn: true }
 */
router.post('/hotmart/login', async (req, res) => {
  try {
    const { sessionId, email, password } = req.body;
    
    if (!sessionId || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Required: sessionId, email, password'
      });
    }
    
    const session = getSession(sessionId);
    
    console.log(`🔐 Logging into Hotmart for session ${sessionId}...`);
    const loginResult = await session.browser.login(email, password);
    
    session.isLoggedIn = loginResult;
    session.lastActivity = new Date();
    session.currentPage = 'dashboard';
    
    res.json({
      success: true,
      isLoggedIn: loginResult,
      message: loginResult 
        ? 'Successfully logged into Hotmart. You can now search the marketplace.'
        : 'Login failed. Check credentials.',
      nextActions: loginResult ? [
        'POST /api/browser/hotmart/search - Search for products',
        'POST /api/browser/hotmart/marketplace - Go to marketplace'
      ] : [
        'Try login again with correct credentials'
      ]
    });
    
  } catch (error) {
    console.error('Hotmart login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/hotmart/marketplace
 * Navigate to Hotmart marketplace
 * 
 * Request: { sessionId: "session-xxx" }
 */
router.post('/hotmart/marketplace', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    
    if (!session.isLoggedIn) {
      return res.status(400).json({
        success: false,
        error: 'Must be logged in first. Call /api/browser/hotmart/login'
      });
    }
    
    console.log(`🏪 Navigating to marketplace for session ${sessionId}...`);
    await session.browser.goToMarketplace();
    
    session.lastActivity = new Date();
    session.currentPage = 'marketplace';
    
    res.json({
      success: true,
      currentPage: 'marketplace',
      message: 'Now on Hotmart marketplace. You can search for products.',
      nextActions: [
        'POST /api/browser/hotmart/search - Search with keywords',
        'POST /api/browser/hotmart/extract - Extract visible products'
      ]
    });
    
  } catch (error) {
    console.error('Marketplace navigation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/hotmart/search
 * Search Hotmart marketplace
 * 
 * Request: { 
 *   sessionId: "session-xxx", 
 *   keywords: "weight loss",
 *   filters: { language: "pt", sortBy: "best_sellers" }
 * }
 */
router.post('/hotmart/search', async (req, res) => {
  try {
    const { sessionId, keywords, filters = {} } = req.body;
    
    if (!sessionId || !keywords) {
      return res.status(400).json({
        success: false,
        error: 'Required: sessionId, keywords'
      });
    }
    
    const session = getSession(sessionId);
    
    if (!session.isLoggedIn) {
      return res.status(400).json({
        success: false,
        error: 'Must be logged in first'
      });
    }
    
    console.log(`🔍 Searching Hotmart for "${keywords}"...`);
    await session.browser.searchMarketplace(keywords, filters);
    
    session.lastActivity = new Date();
    session.currentPage = 'search_results';
    session.lastSearch = { keywords, filters };
    
    res.json({
      success: true,
      searched: keywords,
      filters,
      currentPage: 'search_results',
      message: `Search completed for "${keywords}". Now extract products to see results.`,
      nextActions: [
        'POST /api/browser/hotmart/extract - Extract products from results',
        'POST /api/browser/hotmart/search - Search with different keywords',
        'POST /api/browser/screenshot - See what the page looks like'
      ]
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/hotmart/extract
 * Extract product cards from current page
 * 
 * Request: { sessionId: "session-xxx", maxProducts: 10 }
 * Response: { products: [...], count: 10 }
 */
router.post('/hotmart/extract', async (req, res) => {
  try {
    const { sessionId, maxProducts = 10 } = req.body;
    const session = getSession(sessionId);
    
    console.log(`📦 Extracting up to ${maxProducts} products...`);
    const products = await session.browser.extractProductCards(maxProducts);
    
    session.lastActivity = new Date();
    session.lastExtraction = {
      count: products.length,
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      products,
      count: products.length,
      message: `Extracted ${products.length} products from current page`,
      nextActions: [
        'POST /api/browser/hotmart/details - Get details for a specific product',
        'POST /api/browser/hotmart/search - Search for different products',
        'Analyze these products and decide next steps'
      ]
    });
    
  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/hotmart/details
 * Get detailed information for a specific product
 * 
 * Request: { sessionId: "session-xxx", productUrl: "https://..." }
 */
router.post('/hotmart/details', async (req, res) => {
  try {
    const { sessionId, productUrl } = req.body;
    
    if (!sessionId || !productUrl) {
      return res.status(400).json({
        success: false,
        error: 'Required: sessionId, productUrl'
      });
    }
    
    const session = getSession(sessionId);
    
    console.log(`📋 Getting details for product...`);
    const details = await session.browser.getProductDetails(productUrl);
    
    session.lastActivity = new Date();
    
    res.json({
      success: true,
      product: details,
      message: 'Product details extracted',
      nextActions: [
        'Analyze this product for affiliate potential',
        'POST /api/browser/hotmart/extract - Get more products',
        'POST /api/browser/hotmart/search - Search for related products'
      ]
    });
    
  } catch (error) {
    console.error('Details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/screenshot
 * Take a screenshot of current page
 * 
 * Request: { sessionId: "session-xxx" }
 * Response: { screenshot: "base64..." }
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = getSession(sessionId);
    
    console.log(`📸 Taking screenshot...`);
    const screenshotPath = `/tmp/screenshot-${sessionId}-${Date.now()}.png`;
    await session.browser.screenshot(screenshotPath);
    
    // Read screenshot and convert to base64
    const fs = require('fs');
    const screenshot = fs.readFileSync(screenshotPath, { encoding: 'base64' });
    
    // Clean up
    fs.unlinkSync(screenshotPath);
    
    session.lastActivity = new Date();
    
    res.json({
      success: true,
      screenshot: `data:image/png;base64,${screenshot}`,
      message: 'Screenshot captured',
      note: 'Screenshot is base64 encoded PNG'
    });
    
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/hotmart/research
 * Complete niche research (convenience method)
 * 
 * This combines multiple steps into one call.
 * For true agentic control, use individual endpoints instead.
 * 
 * Request: { 
 *   sessionId: "session-xxx",
 *   niche: "weight loss",
 *   options: { maxProducts: 10, language: "pt", getDetails: true }
 * }
 */
router.post('/hotmart/research', async (req, res) => {
  try {
    const { sessionId, niche, options = {} } = req.body;
    
    if (!sessionId || !niche) {
      return res.status(400).json({
        success: false,
        error: 'Required: sessionId, niche'
      });
    }
    
    const session = getSession(sessionId);
    
    if (!session.isLoggedIn) {
      return res.status(400).json({
        success: false,
        error: 'Must be logged in first'
      });
    }
    
    console.log(`🔬 Starting niche research for "${niche}"...`);
    const products = await session.browser.researchNiche(niche, {
      maxProducts: options.maxProducts || 10,
      language: options.language || null,
      sortBy: options.sortBy || 'best_sellers',
      getDetails: options.getDetails !== false
    });
    
    session.lastActivity = new Date();
    session.currentPage = 'research_complete';
    
    res.json({
      success: true,
      niche,
      products,
      count: products.length,
      message: `Research complete. Found ${products.length} products in "${niche}" niche.`,
      note: 'For more control, use individual endpoints (search, extract, details)'
    });
    
  } catch (error) {
    console.error('Research error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Cleanup stale sessions (run periodically)
 */
const cleanupStaleSessions = async () => {
  const maxAge = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  for (const [sessionId, session] of activeSessions.entries()) {
    const age = now - session.lastActivity.getTime();
    if (age > maxAge) {
      console.log(`🧹 Cleaning up stale session: ${sessionId}`);
      try {
        await session.browser.close();
      } catch (e) {
        // Ignore close errors
      }
      activeSessions.delete(sessionId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupStaleSessions, 5 * 60 * 1000);

module.exports = router;
