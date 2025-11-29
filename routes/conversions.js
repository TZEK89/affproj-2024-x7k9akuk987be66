const express = require('express');
const router = express.Router();

// GET /api/conversions - Get all conversions
router.get('/', async (req, res) => {
  try {
    const { network, product_id, campaign_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT c.*, p.name as product_name, lp.title as landing_page_title,
             cam.name as campaign_name
      FROM conversions c
      LEFT JOIN products p ON c.product_id = p.id
      LEFT JOIN landing_pages lp ON c.landing_page_id = lp.id
      LEFT JOIN campaigns cam ON c.campaign_id = cam.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (network) {
      query += ` AND c.network = $${paramCount}`;
      params.push(network);
      paramCount++;
    }

    if (product_id) {
      query += ` AND c.product_id = $${paramCount}`;
      params.push(product_id);
      paramCount++;
    }

    if (campaign_id) {
      query += ` AND c.campaign_id = $${paramCount}`;
      params.push(campaign_id);
      paramCount++;
    }

    query += ` ORDER BY c.conversion_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await req.db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching conversions:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch conversions', details: error.message }
    });
  }
});

// POST /api/conversions - Record new conversion
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      landing_page_id,
      subscriber_id,
      campaign_id,
      network,
      commission_amount,
      sale_amount,
      source
    } = req.body;

    const result = await req.db.query(
      `INSERT INTO conversions (
        product_id, landing_page_id, subscriber_id, campaign_id,
        network, commission_amount, sale_amount, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [product_id, landing_page_id, subscriber_id, campaign_id, network, commission_amount, sale_amount, source]
    );

    // Update campaign stats if campaign_id provided
    if (campaign_id) {
      await req.db.query(
        `UPDATE campaigns 
         SET conversions = conversions + 1,
             revenue = revenue + $1
         WHERE id = $2`,
        [commission_amount || 0, campaign_id]
      );
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Conversion recorded successfully'
    });
  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to record conversion', details: error.message }
    });
  }
});

// GET /api/conversions/stats - Get conversion statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE conversion_date BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }

    const totalResult = await req.db.query(
      `SELECT 
         COUNT(*) as total_conversions,
         SUM(commission_amount) as total_commission,
         SUM(sale_amount) as total_sales,
         AVG(commission_amount) as avg_commission
       FROM conversions ${dateFilter}`,
      params
    );

    const networkResult = await req.db.query(
      `SELECT 
         network,
         COUNT(*) as conversions,
         SUM(commission_amount) as commission
       FROM conversions ${dateFilter}
       GROUP BY network
       ORDER BY commission DESC`,
      params
    );

    res.json({
      success: true,
      data: {
        overview: {
          total_conversions: parseInt(totalResult.rows[0].total_conversions || 0),
          total_commission: parseFloat(totalResult.rows[0].total_commission || 0),
          total_sales: parseFloat(totalResult.rows[0].total_sales || 0),
          avg_commission: parseFloat(totalResult.rows[0].avg_commission || 0)
        },
        by_network: networkResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching conversion stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch conversion stats', details: error.message }
    });
  }
});

module.exports = router;
