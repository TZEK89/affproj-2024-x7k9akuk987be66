const express = require('express');
const router = express.Router();
const manusBrowserController = require('../services/manus-browser-controller');

/**
 * Get connection instructions for Manus
 * GET /api/manus-browser/instructions/:sessionId
 */
router.get('/instructions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { platformId } = req.query;

    if (!platformId) {
      return res.status(400).json({
        success: false,
        error: 'platformId query parameter is required'
      });
    }

    const instructions = manusBrowserController.getConnectionInstructions(sessionId, platformId);

    if (instructions.error) {
      return res.status(400).json({
        success: false,
        ...instructions
      });
    }

    res.json({
      success: true,
      ...instructions
    });
  } catch (error) {
    console.error('Error getting instructions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get platform configuration
 * GET /api/manus-browser/platform/:platformId
 */
router.get('/platform/:platformId', (req, res) => {
  try {
    const { platformId } = req.params;
    const config = manusBrowserController.getPlatformConfig(platformId);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Platform not found: ${platformId}`
      });
    }

    res.json({
      success: true,
      platform: config
    });
  } catch (error) {
    console.error('Error getting platform config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Encrypt session data (called by Manus after capturing)
 * POST /api/manus-browser/encrypt-session
 */
router.post('/encrypt-session', (req, res) => {
  try {
    const { sessionData } = req.body;

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        error: 'sessionData is required'
      });
    }

    const encrypted = manusBrowserController.encryptSession(sessionData);

    res.json({
      success: true,
      encrypted
    });
  } catch (error) {
    console.error('Error encrypting session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
