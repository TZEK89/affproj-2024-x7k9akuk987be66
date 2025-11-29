const express = require('express');
const router = express.Router();

// GET /api/subscribers - Get all subscribers
router.get('/', async (req, res) => {
  try {
    const { is_active, source, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM email_subscribers WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }

    query += ` ORDER BY subscribed_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching subscribers:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch subscribers', details: error.message }
    });
  }
});

// GET /api/subscribers/:id - Get single subscriber
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('SELECT * FROM email_subscribers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Subscriber not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch subscriber', details: error.message }
    });
  }
});

// POST /api/subscribers - Create new subscriber
router.post('/', async (req, res) => {
  try {
    const {
      email,
      name,
      source,
      campaign_id,
      tags
    } = req.body;

    // Check if email already exists
    const existingResult = await req.db.query(
      'SELECT id FROM email_subscribers WHERE email = $1',
      [email]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already subscribed' }
      });
    }

    const result = await req.db.query(
      `INSERT INTO email_subscribers (
        email, name, source, campaign_id, tags
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [email, name, source, campaign_id, tags]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Subscriber added successfully'
    });
  } catch (error) {
    console.error('Error creating subscriber:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create subscriber', details: error.message }
    });
  }
});

// PUT /api/subscribers/:id - Update subscriber
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'email', 'name', 'source', 'campaign_id', 'tags', 'is_active',
      'convertkit_id', 'sendgrid_id'
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
    const query = `UPDATE email_subscribers SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await req.db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Subscriber not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Subscriber updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update subscriber', details: error.message }
    });
  }
});

// POST /api/subscribers/:id/unsubscribe - Unsubscribe
router.post('/:id/unsubscribe', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await req.db.query(
      `UPDATE email_subscribers 
       SET is_active = false, unsubscribed_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Subscriber not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Subscriber unsubscribed successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to unsubscribe', details: error.message }
    });
  }
});

// DELETE /api/subscribers/:id - Delete subscriber
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('DELETE FROM email_subscribers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Subscriber not found' }
      });
    }

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete subscriber', details: error.message }
    });
  }
});

// GET /api/subscribers/stats - Get subscriber statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalResult = await req.db.query('SELECT COUNT(*) as total FROM email_subscribers');
    const activeResult = await req.db.query('SELECT COUNT(*) as active FROM email_subscribers WHERE is_active = true');
    const sourceResult = await req.db.query(
      `SELECT source, COUNT(*) as count 
       FROM email_subscribers 
       WHERE source IS NOT NULL 
       GROUP BY source 
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        inactive: parseInt(totalResult.rows[0].total) - parseInt(activeResult.rows[0].active),
        by_source: sourceResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch subscriber stats', details: error.message }
    });
  }
});

module.exports = router;
