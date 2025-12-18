const express = require('express');
const router = express.Router();
const localConnectService = require('../services/local-connect');
const logger = require('../config/logger');

/**
 * POST /api/local-connect/:platform/token
 * Generate a short-lived connect token for local connector
 */
router.post('/:platform/token', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Get from auth middleware

    logger.info(`[Local Connect API] Token request for platform: ${platform}, user: ${userId}`);

    const result = await localConnectService.generateConnectToken(userId, platform);

    res.json(result);
  } catch (error) {
    logger.error('[Local Connect API] Error generating token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/local-connect/:platform/upload
 * Upload storageState from local connector
 */
router.post('/:platform/upload', async (req, res) => {
  try {
    const { platform } = req.params;
    const { connectToken, storageState } = req.body;

    if (!connectToken) {
      return res.status(400).json({
        success: false,
        error: 'connectToken is required'
      });
    }

    if (!storageState) {
      return res.status(400).json({
        success: false,
        error: 'storageState is required'
      });
    }

    logger.info(`[Local Connect API] Upload request for platform: ${platform}`);

    const result = await localConnectService.uploadStorageState(connectToken, storageState);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Local Connect API] Error uploading storageState:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/local-connect/:platform/status
 * Get session status
 */
router.get('/:platform/status', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Get from auth middleware

    logger.info(`[Local Connect API] Status request for platform: ${platform}, user: ${userId}`);

    const status = await localConnectService.getSessionStatus(userId, platform);

    res.json(status);
  } catch (error) {
    logger.error('[Local Connect API] Error getting status:', error);
    res.status(500).json({
      connected: false,
      status: 'error',
      cookieCount: 0,
      error: error.message
    });
  }
});

module.exports = router;
