import { Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../../config/logger';

/**
 * Get all assets with filtering and pagination
 * GET /api/assets
 */
export const getAssets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      ai_tool,
      offer_id,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      conditions.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (ai_tool) {
      conditions.push(`ai_tool = $${paramIndex++}`);
      params.push(ai_tool);
    }

    if (offer_id) {
      conditions.push(`offer_id = $${paramIndex++}`);
      params.push(offer_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = ['created_at', 'type', 'ai_tool', 'name'];
    const sortField = validSortFields.includes(String(sort_by)) ? sort_by : 'created_at';
    const orderClause = `ORDER BY ${sortField} ${sort_order === 'ASC' ? 'ASC' : 'DESC'}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM assets ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get assets
    const result = await query(
      `SELECT 
        a.*,
        o.name as offer_name,
        COUNT(DISTINCT ca.campaign_id) as campaign_count
       FROM assets a
       LEFT JOIN offers o ON a.offer_id = o.id
       LEFT JOIN campaign_assets ca ON a.id = ca.asset_id
       ${whereClause}
       GROUP BY a.id, o.name
       ${orderClause}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single asset by ID
 * GET /api/assets/:id
 */
export const getAsset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        a.*,
        o.name as offer_name,
        o.niche as offer_niche
       FROM assets a
       LEFT JOIN offers o ON a.offer_id = o.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Asset not found', 404);
    }

    // Get campaigns using this asset
    const campaigns = await query(
      `SELECT c.id, c.name, c.status, c.roas
       FROM campaigns c
       JOIN campaign_assets ca ON c.id = ca.campaign_id
       WHERE ca.asset_id = $1`,
      [id]
    );

    const asset = {
      ...result.rows[0],
      campaigns: campaigns.rows,
    };

    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new asset
 * POST /api/assets
 */
export const createAsset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      offer_id,
      type,
      name,
      description,
      file_url,
      file_size,
      file_format,
      dimensions,
      duration,
      ai_tool,
      ai_prompt,
      ai_settings,
      metadata,
    } = req.body;

    const result = await query(
      `INSERT INTO assets (
        offer_id, type, name, description, file_url, file_size,
        file_format, dimensions, duration, ai_tool, ai_prompt,
        ai_settings, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        offer_id, type, name, description, file_url, file_size,
        file_format, dimensions, duration, ai_tool, ai_prompt,
        ai_settings ? JSON.stringify(ai_settings) : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    logger.info('Asset created', { assetId: result.rows[0].id, type, name });

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update asset
 * PUT /api/assets/:id
 */
export const updateAsset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if asset exists
    const existing = await query('SELECT id FROM assets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Asset not found', 404);
    }

    // Build UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'file_url', 'file_size', 'file_format',
      'dimensions', 'duration', 'ai_prompt', 'ai_settings', 'metadata'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    values.push(id);

    const result = await query(
      `UPDATE assets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info('Asset updated', { assetId: id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete asset
 * DELETE /api/assets/:id
 */
export const deleteAsset = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if asset is used in active campaigns
    const campaigns = await query(
      `SELECT COUNT(*) FROM campaign_assets ca
       JOIN campaigns c ON ca.campaign_id = c.id
       WHERE ca.asset_id = $1 AND c.status = 'active'`,
      [id]
    );

    if (parseInt(campaigns.rows[0].count) > 0) {
      throw new AppError('Cannot delete asset used in active campaigns', 400);
    }

    const result = await query(
      'DELETE FROM assets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Asset not found', 404);
    }

    logger.info('Asset deleted', { assetId: id });

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get asset statistics by AI tool
 * GET /api/assets/stats/by-tool
 */
export const getAssetStatsByTool = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT 
        ai_tool,
        type,
        COUNT(*) as count,
        SUM(file_size) as total_size
       FROM assets
       WHERE ai_tool IS NOT NULL
       GROUP BY ai_tool, type
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get asset performance metrics
 * GET /api/assets/:id/performance
 */
export const getAssetPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        COUNT(DISTINCT ca.campaign_id) as campaign_count,
        AVG(c.roas) as avg_roas,
        AVG(c.ctr) as avg_ctr,
        SUM(c.conversions) as total_conversions,
        SUM(c.revenue) as total_revenue
       FROM assets a
       LEFT JOIN campaign_assets ca ON a.id = ca.asset_id
       LEFT JOIN campaigns c ON ca.campaign_id = c.id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Asset not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

