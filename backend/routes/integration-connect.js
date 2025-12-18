const express = require('express');
const router = express.Router();
const integrationConnectService = require('../services/integration-connect');
const logger = require('../config/logger');

/**
 * Integration Connect Routes
 * 
 * Implements the two-phase connect flow:
 * 1. POST /start - Launch headed browser for human login
 * 2. POST /complete - Save session after login
 * 3. GET /status - Check connect session status
 * 4. GET /:platform/status - Check saved session status
 */

/**
 * POST /api/integrations/:platform/connect/start
 * 
 * Phase 1: Start the connect flow
 * Launches a headed browser for the user to complete login
 */
router.post('/:platform/connect/start', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Replace with real auth

    logger.info(`[Connect API] Starting connect for platform: ${platform}, user: ${userId}`);

    const result = await integrationConnectService.startConnect(userId, platform);

    res.json(result);
  } catch (error) {
    logger.error('[Connect API] Error in /connect/start:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start connect flow',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/integrations/:platform/connect/complete
 * 
 * Phase 2: Complete the connect flow
 * Verifies login, saves session, closes browser
 */
router.post('/:platform/connect/complete', async (req, res) => {
  try {
    const { connectSessionId } = req.body;

    if (!connectSessionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'connectSessionId is required' }
      });
    }

    logger.info(`[Connect API] Completing connect for session: ${connectSessionId}`);

    const result = await integrationConnectService.completeConnect(connectSessionId);

    res.json(result);
  } catch (error) {
    logger.error('[Connect API] Error in /connect/complete:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to complete connect flow',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/integrations/:platform/connect/status
 * 
 * Get status of an active connect session
 */
router.get('/:platform/connect/status', async (req, res) => {
  try {
    const { connectSessionId } = req.query;

    if (!connectSessionId) {
      return res.status(400).json({
        success: false,
        error: { message: 'connectSessionId query parameter is required' }
      });
    }

    const result = await integrationConnectService.getConnectStatus(connectSessionId);

    res.json(result);
  } catch (error) {
    logger.error('[Connect API] Error in /connect/status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get connect status',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/integrations/:platform/status
 * 
 * Get saved session status for a platform
 */
router.get('/:platform/status', async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId || 1; // TODO: Replace with real auth

    const result = await integrationConnectService.getSessionStatus(userId, platform);

    res.json(result);
  } catch (error) {
    logger.error('[Connect API] Error in /status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get session status',
        details: error.message
      }
    });
  }
});

module.exports = router;
