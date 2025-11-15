import { Response, NextFunction } from 'express';
import { query } from '../../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import logger from '../../config/logger';

/**
 * Get all landing pages
 * GET /api/landing-pages
 */
export const getLandingPages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 20,
      offer_id,
      template,
      status = 'active',
      sort_by = 'created_at',
      sort_order = 'DESC',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`lp.status = $${paramIndex++}`);
      params.push(status);
    }

    if (offer_id) {
      conditions.push(`lp.offer_id = $${paramIndex++}`);
      params.push(offer_id);
    }

    if (template) {
      conditions.push(`lp.template = $${paramIndex++}`);
      params.push(template);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM landing_pages lp ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get landing pages
    const result = await query(
      `SELECT 
        lp.*,
        o.name as offer_name,
        o.niche as offer_niche,
        COUNT(DISTINCT c.id) as campaign_count
       FROM landing_pages lp
       LEFT JOIN offers o ON lp.offer_id = o.id
       LEFT JOIN campaigns c ON lp.id = c.landing_page_id
       ${whereClause}
       GROUP BY lp.id, o.name, o.niche
       ORDER BY lp.${sort_by} ${sort_order === 'ASC' ? 'ASC' : 'DESC'}
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
 * Get single landing page
 * GET /api/landing-pages/:id
 */
export const getLandingPage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        lp.*,
        o.name as offer_name,
        o.niche as offer_niche
       FROM landing_pages lp
       LEFT JOIN offers o ON lp.offer_id = o.id
       WHERE lp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Landing page not found', 404);
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
 * Create new landing page
 * POST /api/landing-pages
 */
export const createLandingPage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      offer_id,
      name,
      slug,
      template,
      headline,
      subheadline,
      cta_text,
      cta_url,
      content,
      styles,
      scripts,
      metadata,
    } = req.body;

    // Generate URL from slug
    const baseUrl = process.env.LANDING_PAGES_BASE_URL || 'https://lp.example.com';
    const url = `${baseUrl}/${slug}`;

    const result = await query(
      `INSERT INTO landing_pages (
        offer_id, name, slug, url, template, headline, subheadline,
        cta_text, cta_url, content, styles, scripts, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        offer_id, name, slug, url, template, headline, subheadline,
        cta_text, cta_url,
        content ? JSON.stringify(content) : null,
        styles ? JSON.stringify(styles) : null,
        scripts ? JSON.stringify(scripts) : null,
        metadata ? JSON.stringify(metadata) : null,
        'active'
      ]
    );

    logger.info('Landing page created', { landingPageId: result.rows[0].id, slug });

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update landing page
 * PUT /api/landing-pages/:id
 */
export const updateLandingPage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if exists
    const existing = await query('SELECT id FROM landing_pages WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new AppError('Landing page not found', 404);
    }

    // Build UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'template', 'headline', 'subheadline', 'cta_text', 'cta_url',
      'content', 'styles', 'scripts', 'metadata', 'status'
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
      `UPDATE landing_pages SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    logger.info('Landing page updated', { landingPageId: id });

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete landing page
 * DELETE /api/landing-pages/:id
 */
export const deleteLandingPage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if used in active campaigns
    const campaigns = await query(
      'SELECT COUNT(*) FROM campaigns WHERE landing_page_id = $1 AND status = $2',
      [id, 'active']
    );

    if (parseInt(campaigns.rows[0].count) > 0) {
      throw new AppError('Cannot delete landing page used in active campaigns', 400);
    }

    const result = await query(
      'DELETE FROM landing_pages WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Landing page not found', 404);
    }

    logger.info('Landing page deleted', { landingPageId: id });

    res.json({
      success: true,
      message: 'Landing page deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get landing page performance
 * GET /api/landing-pages/:id/performance
 */
export const getLandingPagePerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        COUNT(DISTINCT c.id) as campaign_count,
        SUM(c.clicks) as total_clicks,
        SUM(c.conversions) as total_conversions,
        CASE 
          WHEN SUM(c.clicks) > 0 THEN (SUM(c.conversions)::float / SUM(c.clicks)) * 100
          ELSE 0
        END as conversion_rate,
        AVG(c.roas) as avg_roas,
        SUM(c.revenue) as total_revenue
       FROM landing_pages lp
       LEFT JOIN campaigns c ON lp.id = c.landing_page_id
       WHERE lp.id = $1
       GROUP BY lp.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Landing page not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

