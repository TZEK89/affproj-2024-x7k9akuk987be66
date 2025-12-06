/**
 * Agentic Execution Routes
 * 
 * These routes enable TRUE agentic AI research where the AI:
 * - Thinks about what to do
 * - Decides which actions to take
 * - Observes results
 * - Adapts strategy
 * - Repeats until goal achieved
 * 
 * Two modes available:
 * 1. "agentic" - AI controls the browser, makes decisions (Manus/GPT-4)
 * 2. "scripted" - Hardcoded script runs, AI only analyzes at end
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Import executors
let ManusAgenticExecutor = null;
let AgentExecutor = null; // Original scripted executor

try {
  ManusAgenticExecutor = require('../services/agents/ManusAgenticExecutor');
  console.log('✅ ManusAgenticExecutor loaded');
} catch (error) {
  console.warn('⚠️ ManusAgenticExecutor not available:', error.message);
}

try {
  AgentExecutor = require('../services/agents/AgentExecutor');
  console.log('✅ AgentExecutor (scripted) loaded');
} catch (error) {
  console.warn('⚠️ AgentExecutor not available:', error.message);
}

/**
 * POST /api/agents/execute-agentic/:id
 * Execute a mission using TRUE agentic AI (Manus/GPT-4 makes decisions)
 * 
 * The AI will:
 * 1. Login to the platform
 * 2. Decide what to search for
 * 3. Extract and analyze products
 * 4. Adapt strategy based on results
 * 5. Complete when goal is achieved
 */
router.post('/execute-agentic/:id', authenticateToken, async (req, res) => {
  try {
    const missionId = parseInt(req.params.id);
    const { credentials = {} } = req.body;
    
    // Get mission from database
    const missionResult = await db.query(
      'SELECT * FROM agent_missions WHERE id = $1 AND user_id = $2',
      [missionId, req.user.userId]
    );
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    const mission = missionResult.rows[0];
    
    // Check if mission can be executed
    if (!['pending', 'failed'].includes(mission.status)) {
      return res.status(400).json({
        success: false,
        error: `Mission is ${mission.status}. Only pending or failed missions can be executed.`
      });
    }
    
    // Check if ManusAgenticExecutor is available
    if (!ManusAgenticExecutor) {
      return res.status(503).json({
        success: false,
        error: 'Agentic execution not available on this server'
      });
    }
    
    // Get credentials (from request, database, or environment)
    const creds = {
      email: credentials.email || process.env.HOTMART_EMAIL,
      password: credentials.password || process.env.HOTMART_PASSWORD
    };
    
    if (!creds.email || !creds.password) {
      return res.status(400).json({
        success: false,
        error: 'Credentials required. Provide in request body or set HOTMART_EMAIL/PASSWORD env vars.'
      });
    }
    
    // Respond immediately, execute in background
    res.json({
      success: true,
      message: 'Agentic execution started',
      missionId,
      mode: 'agentic',
      description: 'AI is now thinking and making decisions. Check mission status for progress.',
      checkStatus: `GET /api/agents/missions/${missionId}`
    });
    
    // Execute in background
    const executor = new ManusAgenticExecutor(creds);
    executor.execute(mission).catch(error => {
      console.error(`Agentic execution failed for mission ${missionId}:`, error);
    });
    
  } catch (error) {
    console.error('Agentic execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/agents/execute-scripted/:id
 * Execute a mission using the scripted approach (original AgentExecutor)
 * 
 * This follows a fixed script:
 * 1. Login
 * 2. Search for niche keywords
 * 3. Extract products
 * 4. AI analyzes results at the end
 */
router.post('/execute-scripted/:id', authenticateToken, async (req, res) => {
  try {
    const missionId = parseInt(req.params.id);
    const { credentials = {} } = req.body;
    
    // Get mission from database
    const missionResult = await db.query(
      'SELECT * FROM agent_missions WHERE id = $1 AND user_id = $2',
      [missionId, req.user.userId]
    );
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }
    
    const mission = missionResult.rows[0];
    
    // Check if AgentExecutor is available
    if (!AgentExecutor) {
      return res.status(503).json({
        success: false,
        error: 'Scripted execution not available on this server'
      });
    }
    
    // Get credentials
    const creds = {
      email: credentials.email || process.env.HOTMART_EMAIL,
      password: credentials.password || process.env.HOTMART_PASSWORD
    };
    
    if (!creds.email || !creds.password) {
      return res.status(400).json({
        success: false,
        error: 'Credentials required'
      });
    }
    
    // Respond immediately, execute in background
    res.json({
      success: true,
      message: 'Scripted execution started',
      missionId,
      mode: 'scripted',
      description: 'Running predefined research script. AI will analyze results at the end.',
      checkStatus: `GET /api/agents/missions/${missionId}`
    });
    
    // Execute in background
    const executor = new AgentExecutor();
    executor.executeMission(mission, creds).catch(error => {
      console.error(`Scripted execution failed for mission ${missionId}:`, error);
    });
    
  } catch (error) {
    console.error('Scripted execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/agents/execution-modes
 * Get available execution modes
 */
router.get('/execution-modes', (req, res) => {
  res.json({
    success: true,
    modes: [
      {
        id: 'agentic',
        name: 'Agentic AI',
        available: !!ManusAgenticExecutor,
        description: 'AI thinks and makes decisions during research. Adapts strategy based on results.',
        endpoint: 'POST /api/agents/execute-agentic/:id',
        features: [
          'AI decides what to search',
          'Adapts strategy based on findings',
          'Can explore related niches',
          'Intelligent product selection'
        ],
        bestFor: 'Complex research, exploring new niches, finding hidden gems'
      },
      {
        id: 'scripted',
        name: 'Scripted Research',
        available: !!AgentExecutor,
        description: 'Follows predefined script. AI only analyzes results at the end.',
        endpoint: 'POST /api/agents/execute-scripted/:id',
        features: [
          'Fast and predictable',
          'Lower AI costs',
          'Good for known niches'
        ],
        bestFor: 'Quick research, known niches, bulk product discovery'
      }
    ]
  });
});

/**
 * POST /api/agents/missions/:id/execute
 * Smart execution - automatically chooses best mode
 * 
 * Body: {
 *   mode: "agentic" | "scripted" | "auto" (default: "auto"),
 *   credentials: { email, password }
 * }
 */
router.post('/missions/:id/execute', authenticateToken, async (req, res) => {
  try {
    const missionId = parseInt(req.params.id);
    let { mode = 'auto', credentials = {} } = req.body;
    
    // Get mission
    const missionResult = await db.query(
      'SELECT * FROM agent_missions WHERE id = $1 AND user_id = $2',
      [missionId, req.user.userId]
    );
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Mission not found' });
    }
    
    const mission = missionResult.rows[0];
    
    // Auto-select mode based on mission complexity
    if (mode === 'auto') {
      // Use agentic for complex prompts, scripted for simple ones
      const prompt = mission.prompt.toLowerCase();
      const isComplex = 
        prompt.includes('compare') ||
        prompt.includes('analyze') ||
        prompt.includes('best') ||
        prompt.includes('recommend') ||
        prompt.length > 100;
      
      mode = isComplex && ManusAgenticExecutor ? 'agentic' : 'scripted';
    }
    
    // Get credentials
    const creds = {
      email: credentials.email || process.env.HOTMART_EMAIL,
      password: credentials.password || process.env.HOTMART_PASSWORD
    };
    
    if (!creds.email || !creds.password) {
      return res.status(400).json({
        success: false,
        error: 'Credentials required'
      });
    }
    
    // Execute based on mode
    let executor;
    if (mode === 'agentic' && ManusAgenticExecutor) {
      executor = new ManusAgenticExecutor(creds);
      
      res.json({
        success: true,
        message: 'Agentic execution started',
        missionId,
        mode: 'agentic',
        checkStatus: `GET /api/agents/missions/${missionId}`
      });
      
      executor.execute(mission).catch(console.error);
      
    } else if (AgentExecutor) {
      executor = new AgentExecutor();
      
      res.json({
        success: true,
        message: 'Scripted execution started',
        missionId,
        mode: 'scripted',
        checkStatus: `GET /api/agents/missions/${missionId}`
      });
      
      executor.executeMission(mission, creds).catch(console.error);
      
    } else {
      return res.status(503).json({
        success: false,
        error: 'No execution mode available'
      });
    }
    
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
