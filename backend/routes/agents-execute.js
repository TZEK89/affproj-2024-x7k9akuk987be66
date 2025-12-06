/**
 * Agent Execution Routes
 * Endpoints to manually trigger agent mission execution
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const AgentExecutor = require('../services/agents/AgentExecutor');

/**
 * POST /api/agents/execute/:id
 * Manually trigger execution of a pending mission
 * (In production, this will be handled by BullMQ job queue)
 */
router.post('/execute/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { credentials } = req.body;

    // Validate credentials
    if (!credentials || !credentials.email || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: 'Platform credentials required (email, password)'
      });
    }

    // Get mission from database
    const missionResult = await db.query(`
      SELECT * FROM agent_missions 
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.userId]);

    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found'
      });
    }

    const mission = missionResult.rows[0];

    // Check if mission is in correct status
    if (mission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Mission cannot be executed. Current status: ${mission.status}`
      });
    }

    // Execute mission asynchronously
    const executor = new AgentExecutor();
    
    // Don't await - let it run in background
    executor.executeMission(mission, credentials)
      .then(results => {
        console.log(`✅ Mission #${id} completed:`, results);
      })
      .catch(error => {
        console.error(`❌ Mission #${id} failed:`, error.message);
      });

    // Return immediately
    res.json({
      success: true,
      message: 'Mission execution started',
      missionId: id,
      note: 'Check mission status via GET /api/agents/missions/:id'
    });

  } catch (error) {
    console.error('Execute mission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agents/test-browser
 * Test browser automation without executing a full mission
 */
router.post('/test-browser', authenticateToken, async (req, res) => {
  try {
    const { platform, credentials } = req.body;

    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required (hotmart, impact, etc.)'
      });
    }

    if (!credentials || !credentials.email || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: 'Credentials required (email, password)'
      });
    }

    // Import platform automation
    let BrowserAutomation;
    if (platform.toLowerCase() === 'hotmart') {
      BrowserAutomation = require('../services/browser/HotmartAutomation');
    } else {
      return res.status(400).json({
        success: false,
        message: `Platform not supported: ${platform}`
      });
    }

    // Test browser automation
    const browser = new BrowserAutomation();
    
    try {
      await browser.launch();
      const loginSuccess = await browser.login(credentials.email, credentials.password);
      
      if (loginSuccess) {
        await browser.close();
        return res.json({
          success: true,
          message: 'Browser automation test successful',
          platform,
          loginStatus: 'success'
        });
      } else {
        await browser.close();
        return res.status(401).json({
          success: false,
          message: 'Login failed. Please check credentials.',
          platform,
          loginStatus: 'failed'
        });
      }
    } catch (error) {
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('Test browser error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.stack
    });
  }
});

module.exports = router;
