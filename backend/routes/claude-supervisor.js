/**
 * Claude Supervisor API Routes
 *
 * These routes enable Claude to supervise and command Manus.
 * Simple prompts come in, detailed commands go to Manus.
 */

const express = require('express');
const router = express.Router();
const ClaudeManusSupervisor = require('../services/ClaudeManusSupervsor');

const supervisor = new ClaudeManusSupervisor();

/**
 * POST /api/claude/command
 * Main entry point for Claude to send supervised commands to Manus
 *
 * Body:
 *   - prompt: string (simple user prompt)
 *   - taskType: string (research_products, generate_content, etc.)
 *   - context: object (additional context)
 */
router.post('/command', async (req, res) => {
  try {
    const { prompt, taskType, context } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    if (!taskType) {
      return res.status(400).json({
        success: false,
        error: 'Task type is required. Options: research_products, generate_content, generate_image, manage_campaign, analyze_data, write_code'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`CLAUDE SUPERVISOR: New Command`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Task Type: ${taskType}`);
    console.log(`${'='.repeat(60)}\n`);

    const result = await supervisor.executeSupervised(prompt, taskType, context || {});

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Claude supervisor error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/chat
 * Send a chat message through Claude to Manus
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await supervisor.chatWithManus(message, context || {});

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Claude chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/claude/build-prompt
 * Build a Manus command without executing it (for preview/debugging)
 */
router.post('/build-prompt', async (req, res) => {
  try {
    const { prompt, taskType, context } = req.body;

    if (!prompt || !taskType) {
      return res.status(400).json({
        success: false,
        error: 'Prompt and taskType are required'
      });
    }

    const command = supervisor.buildManusCommand(prompt, taskType, context || {});

    res.json({
      success: true,
      command: command
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/test-connection
 * Test the connection to Manus API
 */
router.get('/test-connection', async (req, res) => {
  try {
    const result = await supervisor.testConnection();

    res.json({
      success: result.connected,
      ...result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/claude/task-types
 * List available task types and their descriptions
 */
router.get('/task-types', (req, res) => {
  res.json({
    success: true,
    taskTypes: {
      research_products: {
        description: 'Research and discover affiliate products on marketplaces',
        requiredContext: [],
        optionalContext: ['platform', 'maxProducts', 'minCommission', 'language', 'sortBy']
      },
      generate_content: {
        description: 'Generate marketing content, descriptions, emails, blog posts',
        requiredContext: [],
        optionalContext: ['contentType', 'length', 'tone', 'targetAudience', 'productName', 'format']
      },
      generate_image: {
        description: 'Generate marketing images using AI',
        requiredContext: [],
        optionalContext: ['style', 'size', 'model', 'productName', 'brandColors', 'mood']
      },
      manage_campaign: {
        description: 'Manage, optimize, scale, or pause ad campaigns',
        requiredContext: [],
        optionalContext: ['action', 'campaignId', 'platform', 'currentMetrics']
      },
      analyze_data: {
        description: 'Analyze performance data and generate insights',
        requiredContext: [],
        optionalContext: ['analysisType', 'timeframe', 'metrics', 'data']
      },
      write_code: {
        description: 'Generate code for the affiliate marketing system',
        requiredContext: [],
        optionalContext: ['language', 'framework', 'style', 'includeTests', 'relatedFiles']
      }
    }
  });
});

/**
 * GET /api/claude/history
 * Get history of Claude-Manus tasks
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await req.db.query(`
      SELECT * FROM claude_manus_tasks
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      tasks: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    // Table might not exist yet
    res.json({
      success: true,
      tasks: [],
      count: 0,
      note: 'Task history table not yet created'
    });
  }
});

module.exports = router;
