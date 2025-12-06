const express = require('express');
const router = express.Router();
const db = require('../../db');

/**
 * Hotmart Webhook Handler
 * 
 * Receives real-time notifications from Hotmart for:
 * - Purchases (completed, approved, canceled)
 * - Subscriptions (created, canceled, renewed)
 * - Chargebacks, refunds, etc.
 * 
 * Documentation: https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/
 */

/**
 * Main webhook endpoint
 * POST /api/webhooks/hotmart
 */
router.post('/', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('📥 Hotmart webhook received:', {
      event: event.event,
      id: event.data?.purchase?.transaction,
      product: event.data?.product?.name
    });

    // Acknowledge receipt immediately (Hotmart expects 200 response within 5 seconds)
    res.status(200).json({ 
      success: true, 
      message: 'Webhook received' 
    });

    // Process webhook asynchronously
    processWebhook(event).catch(error => {
      console.error('❌ Error processing Hotmart webhook:', error);
    });

  } catch (error) {
    console.error('❌ Hotmart webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Process webhook event asynchronously
 * @param {Object} event - Webhook event data
 */
async function processWebhook(event) {
  const eventType = event.event;
  const data = event.data;

  try {
    switch (eventType) {
      case 'PURCHASE_COMPLETE':
        await handlePurchaseComplete(data);
        break;
      
      case 'PURCHASE_APPROVED':
        await handlePurchaseApproved(data);
        break;
      
      case 'PURCHASE_CANCELED':
        await handlePurchaseCanceled(data);
        break;
      
      case 'PURCHASE_REFUNDED':
        await handlePurchaseRefunded(data);
        break;
      
      case 'PURCHASE_CHARGEBACK':
        await handlePurchaseChargeback(data);
        break;
      
      case 'SUBSCRIPTION_CANCELLATION':
        await handleSubscriptionCancellation(data);
        break;
      
      case 'SUBSCRIPTION_RENEWAL':
        await handleSubscriptionRenewal(data);
        break;
      
      default:
        console.log(`⚠️  Unhandled Hotmart event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${eventType}:`, error);
    throw error;
  }
}

/**
 * Handle completed purchase
 */
async function handlePurchaseComplete(data) {
  const purchase = data.purchase;
  const product = data.product;
  const buyer = data.buyer;
  const commissions = data.commissions || [];

  console.log('✅ Purchase completed:', purchase.transaction);

  // Find or create product
  let productRecord = await db.query(
    'SELECT id FROM products WHERE network = $1 AND network_id = $2',
    ['hotmart', product.id.toString()]
  );

  if (productRecord.rows.length === 0) {
    // Create product if it doesn't exist
    const result = await db.query(
      `INSERT INTO products (
        external_id, name, price, currency, network, network_id, network_name,
        category, stock_status, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        product.id.toString(),
        product.name,
        purchase.price.value,
        purchase.price.currency_value,
        'hotmart',
        product.id.toString(),
        'Hotmart',
        'Digital Products',
        'InStock',
        JSON.stringify({ has_co_production: product.has_co_production })
      ]
    );
    productRecord = result;
  }

  const productId = productRecord.rows[0].id;

  // Record conversion
  await db.query(
    `INSERT INTO conversions (
      product_id, network, transaction_id, sale_amount, currency,
      commission_amount, status, conversion_date, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (network, transaction_id) DO UPDATE
    SET status = $6, updated_at = NOW()`,
    [
      productId,
      'hotmart',
      purchase.transaction,
      purchase.price.value,
      purchase.price.currency_value,
      commissions[0]?.value || 0,
      'completed',
      new Date(purchase.approved_date || Date.now()),
      JSON.stringify({
        buyer: {
          name: buyer.name,
          email: buyer.email
        },
        product: {
          name: product.name,
          id: product.id
        },
        payment: {
          type: purchase.payment.type,
          installments: purchase.payment.installments_number
        },
        commissions: commissions
      })
    ]
  );

  console.log(`💰 Conversion recorded: ${purchase.transaction}`);
}

/**
 * Handle approved purchase
 */
async function handlePurchaseApproved(data) {
  const purchase = data.purchase;
  
  console.log('✅ Purchase approved:', purchase.transaction);

  await db.query(
    `UPDATE conversions 
     SET status = $1, updated_at = NOW()
     WHERE network = $2 AND transaction_id = $3`,
    ['approved', 'hotmart', purchase.transaction]
  );
}

/**
 * Handle canceled purchase
 */
async function handlePurchaseCanceled(data) {
  const purchase = data.purchase;
  
  console.log('❌ Purchase canceled:', purchase.transaction);

  await db.query(
    `UPDATE conversions 
     SET status = $1, updated_at = NOW()
     WHERE network = $2 AND transaction_id = $3`,
    ['canceled', 'hotmart', purchase.transaction]
  );
}

/**
 * Handle refunded purchase
 */
async function handlePurchaseRefunded(data) {
  const purchase = data.purchase;
  
  console.log('💸 Purchase refunded:', purchase.transaction);

  await db.query(
    `UPDATE conversions 
     SET status = $1, updated_at = NOW()
     WHERE network = $2 AND transaction_id = $3`,
    ['refunded', 'hotmart', purchase.transaction]
  );
}

/**
 * Handle chargeback
 */
async function handlePurchaseChargeback(data) {
  const purchase = data.purchase;
  
  console.log('⚠️  Chargeback:', purchase.transaction);

  await db.query(
    `UPDATE conversions 
     SET status = $1, updated_at = NOW()
     WHERE network = $2 AND transaction_id = $3`,
    ['chargeback', 'hotmart', purchase.transaction]
  );
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(data) {
  const subscription = data.subscription;
  
  console.log('🔔 Subscription canceled:', subscription.subscriber.code);

  // Update subscriber status
  await db.query(
    `UPDATE subscribers 
     SET status = $1, unsubscribed_at = NOW(), updated_at = NOW()
     WHERE email = $2`,
    ['unsubscribed', subscription.subscriber.email]
  );
}

/**
 * Handle subscription renewal
 */
async function handleSubscriptionRenewal(data) {
  const subscription = data.subscription;
  const purchase = data.purchase;
  
  console.log('🔄 Subscription renewed:', subscription.subscriber.code);

  // Record as new conversion
  await handlePurchaseComplete(data);
}

/**
 * Test endpoint
 * GET /api/webhooks/hotmart/test
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Hotmart webhook endpoint is active',
    endpoint: '/api/webhooks/hotmart',
    supportedEvents: [
      'PURCHASE_COMPLETE',
      'PURCHASE_APPROVED',
      'PURCHASE_CANCELED',
      'PURCHASE_REFUNDED',
      'PURCHASE_CHARGEBACK',
      'SUBSCRIPTION_CANCELLATION',
      'SUBSCRIPTION_RENEWAL'
    ]
  });
});

module.exports = router;
