import { Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { getCache, setCache, deleteCache } from '../../config/redis';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { calculateQualityScore } from '../../utils/quality-score';
import logger from '../../config/logger';

/**
 * Get all offers with filtering, sorting, and pagination
 * GET /api/offers
 */
export const getOffers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const {
      page = 1,
      limit = 20,
      niche,
      network_id,
      min_quality_score,
      status = 'active',
      sort_by = 'quality_score',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (niche) {
      conditions.push(`o.niche = $${paramIndex++}`);
      params.push(niche);
    }

    if (network_id) {
      conditions.push(`o.network_id = $${paramIndex++}`);
      params.push(network_id);
    }

    if (min_quality_score) {
      conditions.push(`o.quality_score >= $${paramIndex++}`);
      params.push(min_quality_score);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    const validSortFields = ['quality_score', 'epc', 'conversion_rate', 'created_at', 'name'];
    const sortField = validSortFields.includes(String(sort_by)) ? sort_by : 'quality_score';
    const orderClause = `ORDER BY o.${sortField} ${sort_order === 'ASC' ? 'ASC' : 'DESC'}`;

    // Try cache first
    const cacheKey = `offers:${JSON.stringify(req.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM offers o ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get offers
    const result = await query(
      `SELECT 
        o.*,
        n.name as network_name,
        n.slug as network_slug
       FROM offers o
       LEFT JOIN networks n ON o.network_id = n.id
       ${whereClause}
       ${orderClause}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const response = {
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };

    // Cache for 5 minutes
    await setCache(cacheKey, response, 300);

    return res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single offer by ID
 * GET /api/offers/:id
 */
export const getOffer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        o.*,
        n.name as network_name,
        n.slug as network_slug,
        COUNT(DISTINCT c.id) as campaign_count,
        COALESCE(SUM(c.revenue), 0) as total_revenue,
        COALESCE(SUM(c.conversions), 0) as total_conversions
       FROM offers o
       LEFT JOIN networks n ON o.network_id = n.id
       LEFT JOIN campaigns c ON o.id = c.offer_id
       WHERE o.id = $1
       GROUP BY o.id, n.name, n.slug`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Offer not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new offer
 * POST /api/offers
 */
export const createOffer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      network_id,
      external_id,
      name,
      description,
      niche,
      category,
      commission_type,
      commission_value,
      commission_percentage,
      epc,
      conversion_rate,
      refund_rate,
      gravity,
      landing_page_url,
      tracking_url,
      restrictions,
      metadata,
    } = req.body;

    // Calculate quality score
    const qualityScore = calculateQualityScore({
      epc,
      conversionRate: conversion_rate,
      refundRate: refund_rate,
      gravity,
      commissionValue: commission_value,
      commissionPercentage: commission_percentage,
    });

    const result = await query(
      `INSERT INTO offers (
        network_id, external_id, name, description, niche, category,
        commission_type, commission_value, commission_percentage,
        epc, conversion_rate, refund_rate, gravity,
        landing_page_url, tracking_url, restrictions,
        quality_score, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        network_id, external_id, name, description, niche, category,
        commission_type, commission_value, commission_percentage,
        epc, conversion_rate, refund_rate, gravity,
        landing_page_url, tracking_url, restrictions,
        qualityScore, metadata ? JSON.stringify(metadata) : null, 'active'
      ]
    );

    // Clear offers cache
    await deleteCache('offers:*');

    logger.info('Offer created', { offerId: result.rows[0].id, name });

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update offer
 * PUT /api/offers/:id
 */
export const updateOffer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if offer exists
    const existing = await query('SELECT id FROM offers WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Offer not found', 404);
    }

    // Build UPDATE query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'description', 'niche', 'category',
      'commission_type', 'commission_value', 'commission_percentage',
      'epc', 'conversion_rate', 'refund_rate', 'gravity',
      'landing_page_url', 'tracking_url', 'restrictions',
      'status', 'metadata'
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

    // Recalculate quality score if relevant fields changed
    if (
      updates.epc !== undefined ||
      updates.conversion_rate !== undefined ||
      updates.refund_rate !== undefined ||
      updates.gravity !== undefined ||
      updates.commission_value !== undefined ||
      updates.commission_percentage !== undefined
    ) {
      // Get current values
      const current = await query('SELECT * FROM offers WHERE id = $1', [id]);
      const currentOffer = current.rows[0];

      const qualityScore = calculateQualityScore({
        epc: updates.epc ?? currentOffer.epc,
        conversionRate: updates.conversion_rate ?? currentOffer.conversion_rate,
        refundRate: updates.refund_rate ?? currentOffer.refund_rate,
        gravity: updates.gravity ?? currentOffer.gravity,
        commissionValue: updates.commission_value ?? currentOffer.commission_value,
        commissionPercentage: updates.commission_percentage ?? currentOffer.commission_percentage,
      });

      fields.push(`quality_score = $${paramIndex++}`);
      values.push(qualityScore);
    }

    values.push(id);

    const result = await query(
      `UPDATE offers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    // Clear cache
    await deleteCache('offers:*');

    logger.info('Offer updated', { offerId: id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete offer (soft delete)
 * DELETE /api/offers/:id
 */
export const deleteOffer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if offer has active campaigns
    const campaigns = await query(
      'SELECT COUNT(*) FROM campaigns WHERE offer_id = $1 AND status = $2',
      [id, 'active']
    );

    if (parseInt(campaigns.rows[0].count) > 0) {
      throw new AppError('Cannot delete offer with active campaigns', 400);
    }

    // Soft delete (set status to archived)
    const result = await query(
      'UPDATE offers SET status = $1 WHERE id = $2 RETURNING id',
      ['archived', id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Offer not found', 404);
    }

    // Clear cache
    await deleteCache('offers:*');

    logger.info('Offer deleted', { offerId: id });

    res.json({
      success: true,
      message: 'Offer archived successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get offer statistics
 * GET /api/offers/:id/stats
 */
export const getOfferStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        COUNT(DISTINCT c.id) as campaign_count,
        COUNT(DISTINCT lp.id) as landing_page_count,
        COALESCE(SUM(c.spend), 0) as total_spend,
        COALESCE(SUM(c.revenue), 0) as total_revenue,
        COALESCE(SUM(c.profit), 0) as total_profit,
        COALESCE(SUM(c.clicks), 0) as total_clicks,
        COALESCE(SUM(c.conversions), 0) as total_conversions,
        CASE 
          WHEN SUM(c.spend) > 0 THEN SUM(c.revenue) / SUM(c.spend)
          ELSE 0 
        END as avg_roas
       FROM offers o
       LEFT JOIN campaigns c ON o.id = c.offer_id
       LEFT JOIN landing_pages lp ON o.id = lp.offer_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Offer not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

