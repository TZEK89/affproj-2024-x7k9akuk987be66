import { Response, NextFunction } from 'express';
import { query, transaction } from '../../config/database';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import logger from '../../config/logger';

/**
 * Get all campaigns with filtering and pagination
 * GET /api/campaigns
 */
export const getCampaigns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      platform_id,
      offer_id,
      min_roas,
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    if (platform_id) {
      conditions.push(`c.platform_id = $${paramIndex++}`);
      params.push(platform_id);
    }

    if (offer_id) {
      conditions.push(`c.offer_id = $${paramIndex++}`);
      params.push(offer_id);
    }

    if (min_roas) {
      conditions.push(`c.roas >= $${paramIndex++}`);
      params.push(min_roas);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = ['roas', 'spend', 'revenue', 'profit', 'created_at', 'name'];
    const sortField = validSortFields.includes(String(sort_by)) ? sort_by : 'created_at';
    const orderClause = `ORDER BY c.${sortField} ${sort_order === 'ASC' ? 'ASC' : 'DESC'}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM campaigns c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get campaigns
    const result = await query(
      `SELECT 
        c.*,
        o.name as offer_name,
        o.niche as offer_niche,
        p.name as platform_name,
        p.slug as platform_slug
       FROM campaigns c
       LEFT JOIN offers o ON c.offer_id = o.id
       LEFT JOIN platforms p ON c.platform_id = p.id
       ${whereClause}
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
 * Get single campaign by ID
 * GET /api/campaigns/:id
 */
export const getCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        c.*,
        o.name as offer_name,
        o.niche as offer_niche,
        o.quality_score as offer_quality_score,
        p.name as platform_name,
        p.slug as platform_slug,
        lp.name as landing_page_name,
        lp.url as landing_page_url
       FROM campaigns c
       LEFT JOIN offers o ON c.offer_id = o.id
       LEFT JOIN platforms p ON c.platform_id = p.id
       LEFT JOIN landing_pages lp ON c.landing_page_id = lp.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    // Get associated assets
    const assets = await query(
      `SELECT a.* FROM assets a
       JOIN campaign_assets ca ON a.id = ca.asset_id
       WHERE ca.campaign_id = $1`,
      [id]
    );

    const campaign = {
      ...result.rows[0],
      assets: assets.rows,
    };

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new campaign
 * POST /api/campaigns
 */
export const createCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      offer_id,
      platform_id,
      landing_page_id,
      external_id,
      name,
      budget_daily,
      budget_total,
      bid_strategy,
      targeting,
      start_date,
      end_date,
      asset_ids,
    } = req.body;

    const result = await transaction(async (client) => {
      // Create campaign
      const campaignResult = await client.query(
        `INSERT INTO campaigns (
          offer_id, platform_id, landing_page_id, external_id, name,
          budget_daily, budget_total, bid_strategy, targeting,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          offer_id, platform_id, landing_page_id, external_id, name,
          budget_daily, budget_total, bid_strategy,
          targeting ? JSON.stringify(targeting) : null,
          start_date, end_date, 'draft'
        ]
      );

      const campaign = campaignResult.rows[0];

      // Associate assets if provided
      if (asset_ids && asset_ids.length > 0) {
        for (const assetId of asset_ids) {
          await client.query(
            'INSERT INTO campaign_assets (campaign_id, asset_id) VALUES ($1, $2)',
            [campaign.id, assetId]
          );
        }
      }

      return campaign;
    });

    logger.info('Campaign created', { campaignId: result.id, name });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update campaign
 * PUT /api/campaigns/:id
 */
export const updateCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if campaign exists
    const existing = await query('SELECT id FROM campaigns WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    // Build UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'budget_daily', 'budget_total', 'bid_strategy',
      'targeting', 'start_date', 'end_date'
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
      `UPDATE campaigns SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info('Campaign updated', { campaignId: id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update campaign status
 * PATCH /api/campaigns/:id/status
 */
export const updateCampaignStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await query(
      'UPDATE campaigns SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    logger.info('Campaign status updated', { campaignId: id, status });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update campaign budget
 * PATCH /api/campaigns/:id/budget
 */
export const updateCampaignBudget = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { budget_daily, budget_total } = req.body;

    const result = await query(
      `UPDATE campaigns 
       SET budget_daily = COALESCE($1, budget_daily),
           budget_total = COALESCE($2, budget_total)
       WHERE id = $3
       RETURNING *`,
      [budget_daily, budget_total, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    logger.info('Campaign budget updated', {
      campaignId: id,
      budget_daily,
      budget_total,
    });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete campaign
 * DELETE /api/campaigns/:id
 */
export const deleteCampaign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if campaign can be deleted (only draft campaigns)
    const campaign = await query(
      'SELECT status FROM campaigns WHERE id = $1',
      [id]
    );

    if (campaign.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    if (campaign.rows[0].status !== 'draft') {
      throw new AppError('Only draft campaigns can be deleted', 400);
    }

    await query('DELETE FROM campaigns WHERE id = $1', [id]);

    logger.info('Campaign deleted', { campaignId: id });

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign statistics
 * GET /api/campaigns/:id/stats
 */
export const getCampaignStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Get daily stats for the last N days
    const dailyStats = await query(
      `SELECT 
        DATE(cl.created_at) as date,
        COUNT(DISTINCT cl.id) as clicks,
        COUNT(DISTINCT CASE WHEN cv.status = 'approved' THEN cv.id END) as conversions,
        COALESCE(SUM(CASE WHEN cv.status = 'approved' THEN cv.commission_amount END), 0) as revenue
       FROM clicks cl
       LEFT JOIN conversions cv ON cl.id = cv.click_id
       WHERE cl.campaign_id = $1
         AND cl.created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(cl.created_at)
       ORDER BY date DESC`,
      [id]
    );

    // Get overall stats
    const overall = await query(
      `SELECT 
        spend,
        revenue,
        profit,
        impressions,
        clicks,
        conversions,
        ctr,
        cpc,
        cpa,
        roas
       FROM campaigns
       WHERE id = $1`,
      [id]
    );

    if (overall.rows.length === 0) {
      throw new AppError('Campaign not found', 404);
    }

    res.json({
      success: true,
      data: {
        overall: overall.rows[0],
        daily: dailyStats.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign performance summary
 * GET /api/campaigns/performance
 */
export const getCampaignPerformance = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT * FROM campaign_performance 
       WHERE status IN ('active', 'paused')
       ORDER BY roas DESC
       LIMIT 50`
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
 * Get campaign health status
 * GET /api/campaigns/health
 */
export const getCampaignHealth = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(
      `SELECT * FROM campaign_health_status
       ORDER BY 
         CASE health_status
           WHEN 'critical' THEN 1
           WHEN 'poor' THEN 2
           WHEN 'fair' THEN 3
           WHEN 'good' THEN 4
           WHEN 'excellent' THEN 5
           ELSE 6
         END,
         roas DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

