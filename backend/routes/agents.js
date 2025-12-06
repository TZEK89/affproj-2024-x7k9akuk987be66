/**
 * Agent Routes - Updated with Job Queue Integration
 * 
 * API endpoints for AI agent missions (Core #1: Offer Research).
 * This version integrates with the BullMQ job queue system for
 * proper background processing of research missions.
 * 
 * Key Changes:
 * - POST /missions now queues jobs for async processing
 * - GET /missions/:id/job-status returns real-time queue status
 * - New /queue/* endpoints for system monitoring
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// Import the job system (gracefully handle if not available)
let jobSystem = null;
try {
  jobSystem = require('../jobs');
} catch (error) {
  console.warn('Job system not available:', error.message);
}

/**
 * GET /api/agents
 * Get agent system status and capabilities
 */
router.get('/', async (req, res) => {
  try {
    // Get job system health if available
    let queueHealth = null;
    if (jobSystem) {
      queueHealth = await jobSystem.healthCheck();
    }
    
    res.json({
      success: true,
      name: 'AI Agent System',
      version: '2.0.0',
      status: 'active',
      queueSystem: queueHealth || { status: 'not_configured' },
      capabilities: [
        'marketplace_research',
        'product_analysis',
        'competitor_comparison',
        'niche_discovery',
        'multi_agent_ab_testing'
      ],
      supportedPlatforms: [
        { id: 'hotmart', name: 'Hotmart', status: 'ready' },
        { id: 'impact', name: 'Impact.com', status: 'ready' },
        { id: 'clickbank', name: 'ClickBank', status: 'coming_soon' },
        { id: 'shareasale', name: 'ShareASale', status: 'coming_soon' }
      ],
      agents: [
        { 
          name: 'manus', 
          displayName: 'Manus AI',
          status: 'available', 
          capabilities: ['research', 'analysis', 'multi_step_reasoning'],
          description: 'Fast, efficient research with strong tool use capabilities'
        },
        { 
          name: 'claude', 
          displayName: 'Claude',
          status: 'available', 
          capabilities: ['research', 'analysis', 'comparison', 'detailed_review'],
          description: 'Thorough analysis with nuanced understanding'
        }
      ],
      endpoints: {
        missions: {
          list: 'GET /api/agents/missions',
          create: 'POST /api/agents/missions',
          get: 'GET /api/agents/missions/:id',
          cancel: 'DELETE /api/agents/missions/:id',
          jobStatus: 'GET /api/agents/missions/:id/job-status'
        },
        discoveredProducts: {
          list: 'GET /api/agents/discovered-products',
          affiliate: 'POST /api/agents/discovered-products/:id/affiliate',
          reject: 'POST /api/agents/discovered-products/:id/reject'
        },
        monitoring: {
          stats: 'GET /api/agents/stats',
          queueStats: 'GET /api/agents/queue/stats'
        }
      }
    });
  } catch (error) {
    console.error('Agent system status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/missions
 * List all agent missions for the user
 */
router.get('/missions', authenticateToken, async (req, res) => {
  try {
    const { status, platform, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id, mission_type, platform, prompt, status,
        agents, parameters, started_at, completed_at,
        error_message, results, created_at, updated_at,
        (SELECT COUNT(*) FROM discovered_products WHERE mission_id = agent_missions.id) as products_found
      FROM agent_missions
      WHERE user_id = $1
    `;
    const params = [req.user.userId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM agent_missions WHERE user_id = $1',
      [req.user.userId]
    );
    
    // Enrich with job status if available
    const missions = await Promise.all(result.rows.map(async (mission) => {
      let jobStatus = null;
      if (jobSystem && mission.status === 'queued') {
        jobStatus = await jobSystem.getMissionStatus(mission.id);
      }
      return {
        ...mission,
        jobStatus
      };
    }));
    
    res.json({
      success: true,
      missions,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('List missions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agents/missions
 * Create a new agent research mission
 * Now integrates with the job queue for async processing
 */
router.post('/missions', authenticateToken, async (req, res) => {
  try {
    const {
      missionType = 'research',
      platform,
      prompt,
      agents = ['claude'],
      parameters = {}
    } = req.body;
    
    // Validate required fields
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: 'Platform is required (hotmart, impact, clickbank, shareasale)'
      });
    }
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required (e.g., "Find top 5 products in weight loss niche")'
      });
    }
    
    // Validate platform
    const validPlatforms = ['hotmart', 'impact', 'clickbank', 'shareasale'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}`
      });
    }
    
    // Validate agents
    const validAgents = ['manus', 'claude', 'gpt'];
    const invalidAgents = agents.filter(a => !validAgents.includes(a));
    if (invalidAgents.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid agents: ${invalidAgents.join(', ')}. Must be: ${validAgents.join(', ')}`
      });
    }
    
    // Create mission in database
    const result = await db.query(`
      INSERT INTO agent_missions 
        (user_id, mission_type, platform, prompt, status, agents, parameters, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      req.user.userId,
      missionType,
      platform.toLowerCase(),
      prompt,
      JSON.stringify(agents),
      JSON.stringify({ ...parameters, userId: req.user.userId })
    ]);
    
    const mission = result.rows[0];
    
    // Try to queue the mission for processing
    let jobInfo = null;
    let queueStatus = 'pending';
    
    if (jobSystem && jobSystem.isInitialized()) {
      try {
        const job = await jobSystem.queueMission({
          missionId: mission.id,
          platform: mission.platform,
          prompt: mission.prompt,
          agents: JSON.parse(mission.agents),
          parameters: JSON.parse(mission.parameters)
        });
        
        // Update mission status to queued
        await db.query(`
          UPDATE agent_missions SET status = 'queued', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [mission.id]);
        
        queueStatus = 'queued';
        jobInfo = {
          jobId: job.id,
          state: await job.getState?.() || 'waiting'
        };
      } catch (queueError) {
        console.error('Failed to queue mission:', queueError);
        // Mission stays in 'pending' - can be retried or processed manually
      }
    }
    
    res.status(201).json({
      success: true,
      message: queueStatus === 'queued' 
        ? 'Mission created and queued for processing'
        : 'Mission created (awaiting queue system)',
      mission: {
        id: mission.id,
        missionType: mission.mission_type,
        platform: mission.platform,
        prompt: mission.prompt,
        status: queueStatus,
        agents: JSON.parse(mission.agents),
        parameters: JSON.parse(mission.parameters),
        createdAt: mission.created_at
      },
      job: jobInfo,
      nextSteps: [
        `Check status: GET /api/agents/missions/${mission.id}`,
        `View job progress: GET /api/agents/missions/${mission.id}/job-status`,
        'Results will appear in discovered-products when complete'
      ]
    });
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/missions/:id
 * Get details of a specific mission
 */
router.get('/missions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get mission
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
    
    // Get agent logs
    const logsResult = await db.query(`
      SELECT * FROM agent_logs 
      WHERE mission_id = $1 
      ORDER BY created_at ASC
    `, [id]);
    
    // Get discovered products
    const productsResult = await db.query(`
      SELECT * FROM discovered_products 
      WHERE mission_id = $1 
      ORDER BY ai_score DESC NULLS LAST
    `, [id]);
    
    // Get job status if queued
    let jobStatus = null;
    if (jobSystem && ['queued', 'running'].includes(mission.status)) {
      jobStatus = await jobSystem.getMissionStatus(parseInt(id));
    }
    
    res.json({
      success: true,
      mission: {
        ...mission,
        agents: JSON.parse(mission.agents || '[]'),
        parameters: JSON.parse(mission.parameters || '{}'),
        results: mission.results ? JSON.parse(mission.results) : null,
        logs: logsResult.rows,
        discoveredProducts: productsResult.rows,
        jobStatus
      }
    });
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/missions/:id/job-status
 * Get real-time job queue status for a mission
 */
router.get('/missions/:id/job-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify mission belongs to user
    const missionResult = await db.query(`
      SELECT id, status FROM agent_missions 
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.userId]);
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found'
      });
    }
    
    if (!jobSystem) {
      return res.json({
        success: true,
        message: 'Job system not available',
        missionStatus: missionResult.rows[0].status,
        jobStatus: null
      });
    }
    
    const jobStatus = await jobSystem.getMissionStatus(parseInt(id));
    
    res.json({
      success: true,
      missionId: parseInt(id),
      missionStatus: missionResult.rows[0].status,
      jobStatus: jobStatus || { state: 'not_found' }
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/agents/missions/:id
 * Cancel/delete a mission
 */
router.delete('/missions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if mission exists and belongs to user
    const checkResult = await db.query(`
      SELECT status FROM agent_missions 
      WHERE id = $1 AND user_id = $2
    `, [id, req.user.userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found'
      });
    }
    
    const status = checkResult.rows[0].status;
    
    // Try to cancel in job queue first
    if (jobSystem && ['queued', 'running'].includes(status)) {
      await jobSystem.cancelMission(parseInt(id));
    }
    
    if (status === 'running') {
      // Mark as cancelled instead of deleting
      await db.query(`
        UPDATE agent_missions 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `, [id]);
      
      return res.json({
        success: true,
        message: 'Mission cancelled'
      });
    }
    
    // Delete mission and related data
    await db.query('DELETE FROM discovered_products WHERE mission_id = $1', [id]);
    await db.query('DELETE FROM agent_logs WHERE mission_id = $1', [id]);
    await db.query('DELETE FROM agent_missions WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Mission deleted'
    });
  } catch (error) {
    console.error('Delete mission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/discovered-products
 * List all products discovered by agents
 */
router.get('/discovered-products', authenticateToken, async (req, res) => {
  try {
    const { 
      platform, 
      niche, 
      status, 
      minScore,
      sortBy = 'ai_score',
      sortOrder = 'DESC',
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT dp.*, am.prompt as mission_prompt, am.platform as mission_platform
      FROM discovered_products dp
      LEFT JOIN agent_missions am ON dp.mission_id = am.id
      WHERE am.user_id = $1
    `;
    const params = [req.user.userId];
    let paramIndex = 2;
    
    if (platform) {
      query += ` AND dp.platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }
    
    if (niche) {
      query += ` AND dp.niche ILIKE $${paramIndex}`;
      params.push(`%${niche}%`);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND dp.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (minScore) {
      query += ` AND dp.ai_score >= $${paramIndex}`;
      params.push(parseFloat(minScore));
      paramIndex++;
    }
    
    // Validate sort column
    const allowedSortColumns = ['ai_score', 'commission_rate', 'price', 'created_at', 'name'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'ai_score';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY dp.${sortColumn} ${order} NULLS LAST`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM discovered_products dp
      JOIN agent_missions am ON dp.mission_id = am.id
      WHERE am.user_id = $1
    `;
    const countResult = await db.query(countQuery, [req.user.userId]);
    
    res.json({
      success: true,
      products: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('List discovered products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agents/discovered-products/:id/affiliate
 * Move a discovered product to the main products table (affiliate with it)
 */
router.post('/discovered-products/:id/affiliate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the discovered product
    const dpResult = await db.query(`
      SELECT dp.* FROM discovered_products dp
      JOIN agent_missions am ON dp.mission_id = am.id
      WHERE dp.id = $1 AND am.user_id = $2
    `, [id, req.user.userId]);
    
    if (dpResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discovered product not found'
      });
    }
    
    const dp = dpResult.rows[0];
    
    // Check if already affiliated
    const existingResult = await db.query(`
      SELECT id FROM products 
      WHERE network = $1 AND external_id = $2
    `, [dp.platform, dp.external_id]);
    
    if (existingResult.rows.length > 0) {
      // Update status and return existing product
      await db.query(`
        UPDATE discovered_products SET status = 'affiliated', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
      
      return res.json({
        success: true,
        message: 'Product already in your affiliate list',
        productId: existingResult.rows[0].id,
        alreadyExisted: true
      });
    }
    
    // Add to products table
    const productResult = await db.query(`
      INSERT INTO products (
        name, description, price, currency, commission_rate, commission_type,
        network, network_id, external_id, product_url, category, image_url,
        is_active, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        true, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id
    `, [
      dp.name,
      dp.description,
      dp.price,
      dp.currency,
      dp.commission_rate,
      dp.commission_type,
      dp.platform,
      dp.external_id,
      dp.external_id,
      dp.product_url,
      dp.category,
      dp.image_url,
      JSON.stringify({
        discoveredBy: 'agent',
        missionId: dp.mission_id,
        aiScore: dp.ai_score,
        aiAnalysis: dp.ai_analysis
      })
    ]);
    
    // Update discovered product status
    await db.query(`
      UPDATE discovered_products SET status = 'affiliated', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Product added to your affiliate list',
      productId: productResult.rows[0].id,
      alreadyExisted: false
    });
  } catch (error) {
    console.error('Affiliate product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agents/discovered-products/:id/reject
 * Reject a discovered product
 */
router.post('/discovered-products/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await db.query(`
      UPDATE discovered_products dp
      SET status = 'rejected', 
          ai_analysis = COALESCE(ai_analysis, '{}'::jsonb) || jsonb_build_object('rejectionReason', $3),
          updated_at = CURRENT_TIMESTAMP
      FROM agent_missions am
      WHERE dp.id = $1 AND dp.mission_id = am.id AND am.user_id = $2
      RETURNING dp.id
    `, [id, req.user.userId, reason || 'User rejected']);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Discovered product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product rejected'
    });
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/stats
 * Get agent system statistics for the user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Mission stats
    const missionStats = await db.query(`
      SELECT 
        COUNT(*) as total_missions,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_missions,
        COUNT(*) FILTER (WHERE status = 'running') as running_missions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_missions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_missions,
        COUNT(*) FILTER (WHERE status = 'queued') as queued_missions,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_missions
      FROM agent_missions WHERE user_id = $1
    `, [userId]);
    
    // Product stats
    const productStats = await db.query(`
      SELECT 
        COUNT(*) as total_discovered,
        COUNT(*) FILTER (WHERE status = 'affiliated') as affiliated,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'discovered') as pending_review,
        ROUND(AVG(ai_score)::numeric, 1) as avg_ai_score,
        MAX(ai_score) as max_ai_score
      FROM discovered_products dp
      JOIN agent_missions am ON dp.mission_id = am.id
      WHERE am.user_id = $1
    `, [userId]);
    
    // Platform breakdown
    const platformStats = await db.query(`
      SELECT 
        platform,
        COUNT(*) as mission_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM agent_missions 
      WHERE user_id = $1
      GROUP BY platform
    `, [userId]);
    
    // Recent activity
    const recentMissions = await db.query(`
      SELECT id, platform, prompt, status, created_at
      FROM agent_missions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [userId]);
    
    res.json({
      success: true,
      stats: {
        missions: missionStats.rows[0],
        products: productStats.rows[0],
        byPlatform: platformStats.rows,
        recentActivity: recentMissions.rows
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/agents/queue/stats
 * Get job queue statistics (admin/monitoring endpoint)
 */
router.get('/queue/stats', authenticateToken, async (req, res) => {
  try {
    if (!jobSystem) {
      return res.json({
        success: true,
        message: 'Job system not configured',
        stats: null
      });
    }
    
    const stats = await jobSystem.getStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/agents/queue/retry/:missionId
 * Retry a failed mission
 */
router.post('/queue/retry/:missionId', authenticateToken, async (req, res) => {
  try {
    const { missionId } = req.params;
    
    // Verify mission belongs to user and is in a retryable state
    const missionResult = await db.query(`
      SELECT * FROM agent_missions
      WHERE id = $1 AND user_id = $2 AND status IN ('failed', 'cancelled')
    `, [missionId, req.user.userId]);
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mission not found or not in retryable state'
      });
    }
    
    const mission = missionResult.rows[0];
    
    // Reset mission status
    await db.query(`
      UPDATE agent_missions 
      SET status = 'pending', error_message = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [missionId]);
    
    // Try to queue again
    if (jobSystem && jobSystem.isInitialized()) {
      await jobSystem.queueMission({
        missionId: mission.id,
        platform: mission.platform,
        prompt: mission.prompt,
        agents: JSON.parse(mission.agents),
        parameters: JSON.parse(mission.parameters)
      });
      
      await db.query(`
        UPDATE agent_missions SET status = 'queued', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [missionId]);
    }
    
    res.json({
      success: true,
      message: 'Mission queued for retry'
    });
  } catch (error) {
    console.error('Retry mission error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
