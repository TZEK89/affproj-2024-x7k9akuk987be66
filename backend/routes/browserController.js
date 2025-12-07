/**
 * Browser Controller API
 * Provides HTTP endpoints for AI to control browser automation
 */

const express = require('express');
const router = express.Router();

// Store active browser sessions (in production, use Redis)
const activeSessions = new Map();

// Session cleanup interval (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Try to load HotmartAutomation
let HotmartAutomation;
try {
  HotmartAutomation = require('../services/agents/HotmartAutomation');
  console.log('✅ Browser automation loaded for controller');
} catch (err) {
  console.error('❌ Failed to load HotmartAutomation:', err.message);
}

// Cleanup stale sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      console.log(`[BrowserController] Cleaning up stale session: ${sessionId}`);
      if (session.browser && typeof session.browser.close === 'function') {
        session.browser.close().catch(() => {});
      }
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes


/**
 * POST /api/browser/session/start
 * Start a new browser session
 */
router.post('/session/start', async (req, res) => {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { platform = 'hotmart', options = {} } = req.body;
    
    console.log(`🚀 Starting browser session: ${sessionId}`);
    
    if (!HotmartAutomation) {
      return res.status(500).json({
        success: false,
        error: 'Browser automation not available'
      });
    }
    
    let browser;
    switch (platform.toLowerCase()) {
      case 'hotmart':
        browser = new HotmartAutomation({
          headless: true,
          ...options
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported platform: ${platform}`
        });
    }
    
    // Initialize the browser - use init(), not launch()
    await browser.init();
    
    // Store session
    activeSessions.set(sessionId, {
      browser,
      platform,
      startTime: Date.now(),
      lastActivity: Date.now(),
      state: 'initialized'
    });
    
    console.log(`✅ Browser session started: ${sessionId}`);
    
    res.json({
      success: true,
      sessionId,
      platform,
      message: 'Browser session started successfully'
    });
    
  } catch (error) {
    console.error('❌ Session start error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/session/end
 * End a browser session
 */
router.post('/session/end', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Ending session ${sessionId}`);
    
    await session.browser.close();
    activeSessions.delete(sessionId);
    
    res.json({
      success: true,
      message: 'Session ended successfully'
    });
    
  } catch (error) {
    console.error('[BrowserController] Error ending session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * GET /api/browser/sessions
 * List active sessions
 */
router.get('/sessions', (req, res) => {
  const sessions = [];
  for (const [sessionId, session] of activeSessions.entries()) {
    sessions.push({
      sessionId,
      platform: session.platform,
      state: session.state,
      startTime: new Date(session.startTime).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString(),
      duration: Math.round((Date.now() - session.startTime) / 1000) + 's'
    });
  }
  
  res.json({
    success: true,
    activeSessions: sessions.length,
    sessions
  });
});


/**
 * POST /api/browser/hotmart/login
 * Login to Hotmart
 */
router.post('/hotmart/login', async (req, res) => {
  try {
    const { sessionId, email, password } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Use provided credentials or fall back to environment variables
    const loginEmail = email || process.env.HOTMART_EMAIL;
    const loginPassword = password || process.env.HOTMART_PASSWORD;
    
    if (!loginEmail || !loginPassword) {
      return res.status(400).json({
        success: false,
        error: 'Hotmart credentials not provided and not found in environment'
      });
    }
    
    console.log(`[BrowserController] Logging into Hotmart for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    const result = await session.browser.login(loginEmail, loginPassword);
    session.state = 'logged_in';
    
    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
    
  } catch (error) {
    console.error('[BrowserController] Error logging in:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/marketplace
 * Navigate to marketplace
 */
router.post('/hotmart/marketplace', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Navigating to marketplace for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    await session.browser.navigateToMarketplace();
    session.state = 'at_marketplace';
    
    res.json({
      success: true,
      message: 'Navigated to marketplace',
      state: 'at_marketplace'
    });
    
  } catch (error) {
    console.error('[BrowserController] Error navigating to marketplace:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/search
 * Search for products
 */
router.post('/hotmart/search', async (req, res) => {
  try {
    const { sessionId, keywords, filters = {} } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    if (!keywords) {
      return res.status(400).json({
        success: false,
        error: 'keywords is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Searching marketplace: "${keywords}" for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    const result = await session.browser.searchMarketplace(keywords, filters);
    session.state = 'search_results';
    
    res.json({
      success: true,
      message: `Search completed for: ${keywords}`,
      ...result
    });
    
  } catch (error) {
    console.error('[BrowserController] Error searching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/extract
 * Extract product cards from current page
 */
router.post('/hotmart/extract', async (req, res) => {
  try {
    const { sessionId, maxProducts = 10 } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Extracting products for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    const products = await session.browser.extractProductCards(maxProducts);
    
    res.json({
      success: true,
      productsFound: products.length,
      products
    });
    
  } catch (error) {
    console.error('[BrowserController] Error extracting products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/details
 * Get detailed product information
 */
router.post('/hotmart/details', async (req, res) => {
  try {
    const { sessionId, productUrl } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    if (!productUrl) {
      return res.status(400).json({
        success: false,
        error: 'productUrl is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Getting product details: ${productUrl}`);
    
    session.lastActivity = Date.now();
    const details = await session.browser.getProductDetails(productUrl);
    
    res.json({
      success: true,
      product: details
    });
    
  } catch (error) {
    console.error('[BrowserController] Error getting product details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/research
 * Complete niche research in one call
 */
router.post('/hotmart/research', async (req, res) => {
  try {
    const { sessionId, niche, options = {} } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    if (!niche) {
      return res.status(400).json({
        success: false,
        error: 'niche is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Starting niche research: "${niche}" for session ${sessionId}`);
    
    const maxProducts = options.maxProducts || 10;
    const email = options.email || process.env.HOTMART_EMAIL;
    const password = options.password || process.env.HOTMART_PASSWORD;
    
    session.lastActivity = Date.now();
    
    // Step 1: Login
    console.log('[BrowserController] Step 1: Logging in...');
    await session.browser.login(email, password);
    session.state = 'logged_in';
    
    // Step 2: Navigate to marketplace
    console.log('[BrowserController] Step 2: Navigating to marketplace...');
    await session.browser.navigateToMarketplace();
    session.state = 'at_marketplace';
    
    // Step 3: Search for niche
    console.log(`[BrowserController] Step 3: Searching for "${niche}"...`);
    const searchFilters = {};
    if (options.language) searchFilters.language = options.language;
    if (options.sortBy) searchFilters.sortBy = options.sortBy;
    await session.browser.searchMarketplace(niche, searchFilters);
    session.state = 'search_results';
    
    // Step 4: Extract products
    console.log(`[BrowserController] Step 4: Extracting ${maxProducts} products...`);
    const products = await session.browser.extractProductCards(maxProducts);
    
    res.json({
      success: true,
      niche,
      productsFound: products.length,
      products,
      message: `Found ${products.length} products in the "${niche}" niche`
    });
    
  } catch (error) {
    console.error('[BrowserController] Error in niche research:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/screenshot
 * Take a screenshot of the current page
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { sessionId, fullPage = false } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Taking screenshot for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    const screenshot = await session.browser.takeScreenshot(fullPage);
    
    res.json({
      success: true,
      screenshot: screenshot.toString('base64'),
      format: 'png',
      encoding: 'base64'
    });
    
  } catch (error) {
    console.error('[BrowserController] Error taking screenshot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


/**
 * POST /api/browser/hotmart/verify
 * Enter verification code for email 2FA
 */
router.post('/hotmart/verify', async (req, res) => {
  try {
    const { sessionId, code } = req.body;
    
    if (!sessionId || !code) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and code are required'
      });
    }
    
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    console.log(`[BrowserController] Entering verification code for session ${sessionId}`);
    
    session.lastActivity = Date.now();
    
    // Find the code input field and enter the code
    // Try different possible selectors for the verification code input
    let codeEntered = false;
    
    // Try single input field (most common)
    const singleInput = await session.browser.page.$('input[type="text"], input[type="number"], input[maxlength="6"]');
    if (singleInput) {
      await singleInput.fill(code);
      codeEntered = true;
      console.log('[BrowserController] Code entered in single input field');
    } else {
      // Try individual digit inputs (6 separate inputs)
      const digitInputs = await session.browser.page.$$('input[maxlength="1"]');
      if (digitInputs.length === 6) {
        for (let i = 0; i < 6; i++) {
          await digitInputs[i].fill(code[i]);
        }
        codeEntered = true;
        console.log('[BrowserController] Code entered in 6 separate digit inputs');
      }
    }
    
    if (!codeEntered) {
      return res.status(404).json({
        success: false,
        error: 'Could not find verification code input field'
      });
    }
    
    // Click the verify/login button
    const verifyButton = await session.browser.page.$('button:has-text("Verification & Login"), button:has-text("Verify"), button:has-text("Continue"), button:has-text("Submit")');
    if (verifyButton) {
      await verifyButton.click();
      console.log('[BrowserController] Clicked verification button');
    } else {
      console.log('[BrowserController] Warning: Could not find verification button, code entered but not submitted');
    }
    
    // Wait for navigation/redirect
    await session.browser.page.waitForTimeout(5000);
    
    const currentUrl = session.browser.page.url();
    const isVerified = !currentUrl.includes('verification') && !currentUrl.includes('verify');
    
    res.json({
      success: true,
      message: 'Verification code entered',
      verified: isVerified,
      url: currentUrl
    });
    
  } catch (error) {
    console.error('[BrowserController] Error entering verification code:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


module.exports = router;
