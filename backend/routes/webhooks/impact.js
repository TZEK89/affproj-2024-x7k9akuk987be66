const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * POST /api/webhooks/impact/conversion
 * Webhook endpoint for Impact.com conversion notifications
 * 
 * Impact.com will send POST requests to this endpoint when conversions occur
 * Documentation: https://integrations.impact.com/impact-publisher/docs/webhooks
 */
router.post('/conversion', async (req, res) => {
  try {
    const payload = req.body;
    
    console.log('Received Impact.com conversion webhook:', JSON.stringify(payload, null, 2));

    // Extract conversion data from webhook payload
    const conversion = {
      external_id: payload.ActionId || payload.Id,
      campaign_id: payload.CampaignId,
      click_id: payload.ClickId,
      order_id: payload.OrderId,
      product_id: payload.ProductId || null,
      amount: parseFloat(payload.Amount) || 0,
      payout: parseFloat(payload.Payout) || 0,
      currency: payload.Currency || 'USD',
      status: payload.Status || 'pending',
      event_date: payload.EventDate || new Date().toISOString(),
      network: 'impact',
      metadata: payload
    };

    // Check if conversion already exists
    const existingConversion = await db.query(
      'SELECT id FROM conversions WHERE external_id = $1 AND network = $2',
      [conversion.external_id, 'impact']
    );

    if (existingConversion.rows.length > 0) {
      // Update existing conversion (status might have changed)
      await db.query(`
        UPDATE conversions 
        SET 
          status = $1,
          amount = $2,
          payout = $3,
          metadata = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE external_id = $5 AND network = $6
      `, [
        conversion.status,
        conversion.amount,
        conversion.payout,
        JSON.stringify(conversion.metadata),
        conversion.external_id,
        'impact'
      ]);

      console.log(`Updated conversion ${conversion.external_id}`);
    } else {
      // Insert new conversion
      await db.query(`
        INSERT INTO conversions (
          external_id, campaign_id, click_id, order_id, product_id,
          amount, payout, currency, status, event_date, network, metadata,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        conversion.external_id,
        conversion.campaign_id,
        conversion.click_id,
        conversion.order_id,
        conversion.product_id,
        conversion.amount,
        conversion.payout,
        conversion.currency,
        conversion.status,
        conversion.event_date,
        conversion.network,
        JSON.stringify(conversion.metadata)
      ]);

      console.log(`Created new conversion ${conversion.external_id}`);
    }

    // Respond with 200 OK to acknowledge receipt
    res.status(200).json({ 
      success: true, 
      message: 'Conversion received' 
    });

  } catch (error) {
    console.error('Error processing Impact.com webhook:', error);
    // Still return 200 to prevent Impact.com from retrying
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/webhooks/impact/action-update
 * Webhook endpoint for Impact.com action updates
 * 
 * This handles status changes for existing actions (e.g., pending -> approved)
 */
router.post('/action-update', async (req, res) => {
  try {
    const payload = req.body;
    
    console.log('Received Impact.com action update webhook:', JSON.stringify(payload, null, 2));

    const actionId = payload.ActionId || payload.Id;
    const newStatus = payload.Status;

    if (!actionId || !newStatus) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing ActionId or Status' 
      });
    }

    // Update conversion status
    const result = await db.query(`
      UPDATE conversions 
      SET 
        status = $1,
        metadata = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE external_id = $3 AND network = $4
      RETURNING id
    `, [
      newStatus,
      JSON.stringify(payload),
      actionId,
      'impact'
    ]);

    if (result.rows.length > 0) {
      console.log(`Updated action ${actionId} to status ${newStatus}`);
    } else {
      console.warn(`Action ${actionId} not found in database`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Action update received' 
    });

  } catch (error) {
    console.error('Error processing Impact.com action update:', error);
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/webhooks/impact/test
 * Test endpoint to verify webhook is accessible
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Impact.com webhook endpoint is accessible',
    endpoints: {
      conversion: '/api/webhooks/impact/conversion',
      actionUpdate: '/api/webhooks/impact/action-update'
    }
  });
});

module.exports = router;
