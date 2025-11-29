const express = require('express');
const router = express.Router();

// GET /api/campaigns - Get all campaigns
router.get('/', async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM campaigns WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch campaigns', details: error.message }
    });
  }
});

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('SELECT * FROM campaigns WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch campaign', details: error.message }
    });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      status,
      budget,
      start_date,
      end_date
    } = req.body;

    const result = await req.db.query(
      `INSERT INTO campaigns (
        name, description, type, status, budget, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [name, description, type, status || 'draft', budget, start_date, end_date]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create campaign', details: error.message }
    });
  }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'description', 'type', 'status', 'budget', 'spent',
      'revenue', 'clicks', 'conversions', 'start_date', 'end_date'
    ];

    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid fields to update' }
      });
    }

    values.push(id);
    const query = `UPDATE campaigns SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await req.db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Campaign updated successfully'
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update campaign', details: error.message }
    });
  }
});

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found' }
      });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete campaign', details: error.message }
    });
  }
});

// GET /api/campaigns/:id/stats - Get campaign statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaignResult = await req.db.query('SELECT * FROM campaigns WHERE id = $1', [id]);
    
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found' }
      });
    }

    const campaign = campaignResult.rows[0];
    
    // Calculate ROI and other metrics
    const roi = campaign.revenue > 0 && campaign.spent > 0
      ? ((campaign.revenue - campaign.spent) / campaign.spent * 100).toFixed(2)
      : 0;
    
    const conversionRate = campaign.clicks > 0
      ? (campaign.conversions / campaign.clicks * 100).toFixed(2)
      : 0;
    
    const costPerClick = campaign.clicks > 0
      ? (campaign.spent / campaign.clicks).toFixed(2)
      : 0;
    
    const costPerConversion = campaign.conversions > 0
      ? (campaign.spent / campaign.conversions).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        ...campaign,
        stats: {
          roi: parseFloat(roi),
          conversion_rate: parseFloat(conversionRate),
          cost_per_click: parseFloat(costPerClick),
          cost_per_conversion: parseFloat(costPerConversion),
          profit: campaign.revenue - campaign.spent
        }
      }
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch campaign stats', details: error.message }
    });
  }
});

module.exports = router;
