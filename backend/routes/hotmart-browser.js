const express = require('express');
const router = express.Router();

let hotmartLoginService = null;

// Initialize service
function getHotmartLoginService() {
  if (!hotmartLoginService) {
    throw new Error('Hotmart login service not initialized');
  }
  return hotmartLoginService;
}

// Set service instance (called from server.js)
function setHotmartLoginService(service) {
  hotmartLoginService = service;
}

/**
 * POST /api/hotmart-browser/login
 * Login to Hotmart account using browser automation
 * Body: { twoFactorCode?: string }
 */
router.post('/login', async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    
    console.log('[API] Hotmart browser login request');
    
    const service = getHotmartLoginService();
    const result = await service.login(twoFactorCode);
    
    console.log(`[API] Hotmart login result: ${result.status}`);
    
    res.json({
      success: result.status === 'SUCCESS',
      status: result.status,
      url: result.url,
      screenshot: result.screenshot,
      message: result.status === 'NEEDS_2FA' 
        ? 'Two-factor authentication required. Please provide the code.'
        : result.status === 'SUCCESS'
        ? 'Login successful!'
        : 'Login completed'
    });
  } catch (error) {
    console.error('[API] Hotmart login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/hotmart-browser/session
 * Get current session status
 */
router.get('/session', async (req, res) => {
  try {
    const service = getHotmartLoginService();
    const isLoggedIn = service.isLoggedIn();
    const cookies = service.getSessionCookies();
    
    res.json({
      success: true,
      isLoggedIn,
      hasCookies: !!cookies,
      cookieCount: cookies ? cookies.length : 0
    });
  } catch (error) {
    console.error('[API] Session check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/hotmart-browser/map-structure
 * Map the entire Hotmart marketplace structure after login
 * Requires authenticated session
 */
router.post('/map-structure', async (req, res) => {
  try {
    const service = getHotmartLoginService();
    
    if (!service.isLoggedIn()) {
      return res.status(401).json({
        success: false,
        error: 'Not logged in. Please login first.'
      });
    }
    
    console.log('[API] Starting Hotmart structure mapping...');
    
    // TODO: Implement structure mapping
    // This will navigate through the marketplace and capture all sections
    
    res.json({
      success: true,
      message: 'Structure mapping not yet implemented'
    });
  } catch (error) {
    console.error('[API] Structure mapping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.setHotmartLoginService = setHotmartLoginService;
