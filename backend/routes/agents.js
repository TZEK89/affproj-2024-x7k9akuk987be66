/**
 * Agent Routes
 * API endpoints for AI agent missions (Core #1: Offer Research)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

/**
 * GET /api/agents
 * Get agent system status and capabilities
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      name: 'AI Agent System',
      version: '1.0.0',
      status: 'active',
      capabilities: [
        'marketplace_research',
        'product_analysis',
        'competitor_comparison',
        'niche_discovery'
      ],
      supportedPlatforms: ['hotmart', 'impact', 'clickbank', 'shareasale'],
      agents: [
        { name: 'manus', status: 'available', capabilities: ['research', 'analysis'] },
        { name: 'claude', status: 'available', capabilities: ['research', 'analysis', 'comparison'] }
      ]
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
        error_message, created_at, updated_at,
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
    
    res.json({
      success: true,
      missions: result.rows,
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
      JSON.stringify(parameters)
    ]);
    
    const mission = result.rows[0];
    
    // TODO: In Phase 3, this will queue the mission for execution
    // For now, we just create it with 'pending' status
    
    res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      mission: {
        id: mission.id,
        missionType: mission.mission_type,
        platform: mission.platform,
        prompt: mission.prompt,
        status: mission.status,
        agents: mission.agents,
        parameters: mission.parameters,
        createdAt: mission.created_at
      },
      note: 'Mission is queued. Agent execution will be implemented in Phase 3.'
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
    
    res.json({
      success: true,
      mission: {
        ...mission,
        logs: logsResult.rows,
        discoveredProducts: productsResult.rows
      }
    });
  } catch (error) {
    console.error('Get mission error:', error);
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
      SELECT dp.*, am.prompt as mission_prompt
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
    const allowedSortColumns = ['ai_score', 'commission_rate', 'price', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sortBy) ? sortBy : 'ai_score';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY dp.${sortColumn} ${order} NULLS LAST`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      products: result.rows,
      pagination: {
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
        productId: existingResult.rows[0].id
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
      productId: productResult.rows[0].id
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
 * Get agent system statistics
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
        COUNT(*) FILTER (WHERE status = 'pending') as pending_missions
      FROM agent_missions WHERE user_id = $1
    `, [userId]);
    
    // Product stats
    const productStats = await db.query(`
      SELECT 
        COUNT(*) as total_discovered,
        COUNT(*) FILTER (WHERE status = 'affiliated') as affiliated,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'discovered') as pending_review,
        AVG(ai_score) as avg_ai_score
      FROM discovered_products dp
      JOIN agent_missions am ON dp.mission_id = am.id
      WHERE am.user_id = $1
    `, [userId]);
    
    // Platform breakdown
    const platformStats = await db.query(`
      SELECT 
        platform,
        COUNT(*) as count
      FROM agent_missions 
      WHERE user_id = $1
      GROUP BY platform
    `, [userId]);
    
    res.json({
      success: true,
      stats: {
        missions: missionStats.rows[0],
        products: productStats.rows[0],
        byPlatform: platformStats.rows
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
