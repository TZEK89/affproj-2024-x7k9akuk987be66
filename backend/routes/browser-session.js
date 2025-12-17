const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/supabase');

// In-memory storage for active browser sessions
const activeSessions = new Map();

/**
 * Start a new browser session for platform connection
 * POST /api/browser-session/start
 */
router.post('/start', async (req, res) => {
  try {
    const { platformId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Create session ID
    const sessionId = uuidv4();

    // Store session metadata
    const sessionData = {
      id: sessionId,
      platformId,
      userId,
      status: 'pending', // pending, active, success, failed
      createdAt: new Date().toISOString(),
      currentUrl: null,
      lastScreenshot: null,
      logs: []
    };

    activeSessions.set(sessionId, sessionData);

    // Save to database
    await supabase
      .from('browser_sessions')
      .insert({
        id: sessionId,
        platform_id: platformId,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    res.json({
      success: true,
      sessionId,
      viewUrl: `/browser-session/${sessionId}`
    });
  } catch (error) {
    console.error('Error starting browser session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get browser session status and current screenshot
 * GET /api/browser-session/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = activeSessions.get(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        platformId: session.platformId,
        status: session.status,
        currentUrl: session.currentUrl,
        lastScreenshot: session.lastScreenshot,
        logs: session.logs.slice(-10) // Last 10 log entries
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update browser session (called by Manus)
 * PUT /api/browser-session/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentUrl, screenshot, log } = req.body;

    const session = activeSessions.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Update session data
    if (status) session.status = status;
    if (currentUrl) session.currentUrl = currentUrl;
    if (screenshot) session.lastScreenshot = screenshot;
    if (log) session.logs.push({ timestamp: new Date().toISOString(), message: log });

    activeSessions.set(id, session);

    // Update database
    await supabase
      .from('browser_sessions')
      .update({
        status: session.status,
        current_url: session.currentUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Complete browser session with captured session data
 * POST /api/browser-session/:id/complete
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionData, success } = req.body;

    const session = activeSessions.get(id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.status = success ? 'success' : 'failed';
    activeSessions.set(id, session);

    if (success && sessionData) {
      // Save encrypted session data
      await supabase
        .from('platform_connections')
        .update({
          session_data: sessionData, // Already encrypted by Manus
          status: 'connected',
          last_verified_at: new Date().toISOString()
        })
        .eq('platform_id', session.platformId)
        .eq('user_id', session.userId);
    }

    // Update browser session
    await supabase
      .from('browser_sessions')
      .update({
        status: session.status,
        completed_at: new Date().toISOString()
      })
      .eq('id', id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
