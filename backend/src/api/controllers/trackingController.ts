import { Request, Response, NextFunction } from 'express';
import { query, transaction } from '../../config/database';
import { AppError } from '../middleware/errorHandler';
import logger from '../../config/logger';

/**
 * Track a click
 * POST /api/track/click
 * Public endpoint (no auth required)
 */
export const trackClick = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      campaign_id,
      offer_id,
      landing_page_id,
      user_agent,
      ip_address,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      device_type,
      browser,
      os,
      country,
      city,
      metadata,
    } = req.body;

    // Generate unique click ID
    const clickId = `clk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await query(
      `INSERT INTO clicks (
        click_id, campaign_id, offer_id, landing_page_id,
        user_agent, ip_address, referrer,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        device_type, browser, os, country, city, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING id, click_id`,
      [
        clickId, campaign_id, offer_id, landing_page_id,
        user_agent, ip_address, referrer,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        device_type, browser, os, country, city,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    logger.info('Click tracked', {
      clickId,
      campaign_id,
      offer_id,
      country,
    });

    res.json({
      success: true,
      data: {
        click_id: clickId,
        tracking_id: result.rows[0].id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track a conversion
 * POST /api/track/conversion
 * Public endpoint (no auth required)
 */
export const trackConversion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      click_id,
      external_id,
      order_id,
      order_value,
      commission_amount,
      commission_percentage,
      currency,
      status,
      metadata,
    } = req.body;

    // Find the click
    const click = await query(
      'SELECT id, campaign_id, offer_id FROM clicks WHERE click_id = $1',
      [click_id]
    );

    if (click.rows.length === 0) {
      throw new AppError('Click not found', 404);
    }

    const clickData = click.rows[0];

    const result = await transaction(async (client) => {
      // Create conversion
      const conversion = await client.query(
        `INSERT INTO conversions (
          click_id, campaign_id, offer_id, external_id, order_id,
          order_value, commission_amount, commission_percentage,
          currency, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          clickData.id, clickData.campaign_id, clickData.offer_id,
          external_id, order_id, order_value, commission_amount,
          commission_percentage, currency, status || 'pending',
          metadata ? JSON.stringify(metadata) : null
        ]
      );

      // Update campaign metrics if conversion is approved
      if (status === 'approved') {
        await client.query(
          `UPDATE campaigns
           SET conversions = conversions + 1,
               revenue = revenue + $1
           WHERE id = $2`,
          [commission_amount || 0, clickData.campaign_id]
        );
      }

      return conversion.rows[0];
    });

    logger.info('Conversion tracked', {
      conversionId: result.id,
      click_id,
      campaign_id: clickData.campaign_id,
      commission_amount,
      status: result.status,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update conversion status
 * PATCH /api/track/conversion/:id/status
 * Public endpoint (webhook from affiliate networks)
 */
export const updateConversionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'reversed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    // Get current conversion
    const current = await query(
      'SELECT * FROM conversions WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      throw new AppError('Conversion not found', 404);
    }

    const conversion = current.rows[0];
    const oldStatus = conversion.status;

    await transaction(async (client) => {
      // Update conversion status
      await client.query(
        `UPDATE conversions
         SET status = $1,
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{status_reason}',
               $2::jsonb
             )
         WHERE id = $3`,
        [status, JSON.stringify(reason || ''), id]
      );

      // Update campaign metrics
      if (oldStatus !== status) {
        // If changing from approved to rejected/reversed
        if (oldStatus === 'approved' && (status === 'rejected' || status === 'reversed')) {
          await client.query(
            `UPDATE campaigns
             SET conversions = GREATEST(conversions - 1, 0),
                 revenue = GREATEST(revenue - $1, 0)
             WHERE id = $2`,
            [conversion.commission_amount || 0, conversion.campaign_id]
          );
        }

        // If changing from rejected/pending to approved
        if ((oldStatus === 'rejected' || oldStatus === 'pending') && status === 'approved') {
          await client.query(
            `UPDATE campaigns
             SET conversions = conversions + 1,
                 revenue = revenue + $1
             WHERE id = $2`,
            [conversion.commission_amount || 0, conversion.campaign_id]
          );
        }
      }
    });

    logger.info('Conversion status updated', {
      conversionId: id,
      oldStatus,
      newStatus: status,
      campaign_id: conversion.campaign_id,
    });

    res.json({
      success: true,
      message: 'Conversion status updated',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get clicks for a campaign
 * GET /api/track/clicks
 */
export const getClicks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      campaign_id,
      offer_id,
      page = 1,
      limit = 50,
      start_date,
      end_date,
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (campaign_id) {
      conditions.push(`campaign_id = $${paramIndex++}`);
      params.push(campaign_id);
    }

    if (offer_id) {
      conditions.push(`offer_id = $${paramIndex++}`);
      params.push(offer_id);
    }

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT * FROM clicks
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
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
 * Get conversions for a campaign
 * GET /api/track/conversions
 */
export const getConversions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      campaign_id,
      offer_id,
      status,
      page = 1,
      limit = 50,
      start_date,
      end_date,
    } = req.query;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (campaign_id) {
      conditions.push(`campaign_id = $${paramIndex++}`);
      params.push(campaign_id);
    }

    if (offer_id) {
      conditions.push(`offer_id = $${paramIndex++}`);
      params.push(offer_id);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (start_date) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT * FROM conversions
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

