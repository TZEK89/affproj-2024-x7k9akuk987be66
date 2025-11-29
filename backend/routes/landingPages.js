const express = require('express');
const router = express.Router();

// GET /api/landing-pages - Get all landing pages
router.get('/', async (req, res) => {
  try {
    const { is_published, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT lp.*, p.name as product_name, p.price as product_price
      FROM landing_pages lp
      LEFT JOIN products p ON lp.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (is_published !== undefined) {
      query += ` AND lp.is_published = $${paramCount}`;
      params.push(is_published === 'true');
      paramCount++;
    }

    query += ` ORDER BY lp.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching landing pages:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch landing pages', details: error.message }
    });
  }
});

// GET /api/landing-pages/:slug - Get landing page by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await req.db.query(
      `SELECT lp.*, p.name as product_name, p.price as product_price, p.affiliate_link
       FROM landing_pages lp
       LEFT JOIN products p ON lp.product_id = p.id
       WHERE lp.slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Landing page not found' }
      });
    }

    // Increment view count
    await req.db.query(
      'UPDATE landing_pages SET views = views + 1 WHERE slug = $1',
      [slug]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching landing page:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch landing page', details: error.message }
    });
  }
});

// POST /api/landing-pages - Create new landing page
router.post('/', async (req, res) => {
  try {
    const {
      slug,
      product_id,
      title,
      meta_description,
      content,
      schema_markup,
      template,
      is_published
    } = req.body;

    const result = await req.db.query(
      `INSERT INTO landing_pages (
        slug, product_id, title, meta_description, content,
        schema_markup, template, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        slug, product_id, title, meta_description, content,
        schema_markup, template, is_published !== undefined ? is_published : false
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Landing page created successfully'
    });
  } catch (error) {
    console.error('Error creating landing page:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create landing page', details: error.message }
    });
  }
});

// PUT /api/landing-pages/:id - Update landing page
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'slug', 'product_id', 'title', 'meta_description', 'content',
      'schema_markup', 'template', 'is_published'
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
    const query = `UPDATE landing_pages SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await req.db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Landing page not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Landing page updated successfully'
    });
  } catch (error) {
    console.error('Error updating landing page:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update landing page', details: error.message }
    });
  }
});

// DELETE /api/landing-pages/:id - Delete landing page
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('DELETE FROM landing_pages WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Landing page not found' }
      });
    }

    res.json({
      success: true,
      message: 'Landing page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting landing page:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete landing page', details: error.message }
    });
  }
});

// POST /api/landing-pages/:slug/track-conversion - Track conversion
router.post('/:slug/track-conversion', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Increment conversion count
    const result = await req.db.query(
      `UPDATE landing_pages 
       SET conversions = conversions + 1,
           conversion_rate = CASE 
             WHEN views > 0 THEN ROUND(((conversions + 1)::numeric / views::numeric * 100), 2)
             ELSE 0
           END
       WHERE slug = $1
       RETURNING *`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Landing page not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Conversion tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to track conversion', details: error.message }
    });
  }
});

module.exports = router;
