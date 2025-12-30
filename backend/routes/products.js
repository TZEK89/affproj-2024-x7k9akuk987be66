const express = require('express');
const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { category, network, is_active, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (network) {
      query += ` AND network = $${paramCount}`;
      params.push(network);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
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
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch products', details: error.message }
    });
  }
});

// GET /api/products/discovery - Get discovery products with filters
router.get('/discovery', async (req, res) => {
  try {
    const {
      stage,
      platform,
      marketplace_id,
      is_affiliated,
      is_promoted,
      min_score,
      max_score,
      category,
      search,
      sort_by = 'overall_score',
      sort_order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Apply filters
    if (stage) {
      query += ` AND stage = $${paramCount}`;
      params.push(stage);
      paramCount++;
    }

    if (platform) {
      query += ` AND (network = $${paramCount} OR platform = $${paramCount})`;
      params.push(platform);
      paramCount++;
    }

    if (marketplace_id) {
      query += ` AND marketplace_id = $${paramCount}`;
      params.push(parseInt(marketplace_id));
      paramCount++;
    }

    if (is_affiliated !== undefined) {
      query += ` AND is_affiliated = $${paramCount}`;
      params.push(is_affiliated === 'true');
      paramCount++;
    }

    if (is_promoted !== undefined) {
      query += ` AND is_promoted = $${paramCount}`;
      params.push(is_promoted === 'true');
      paramCount++;
    }

    if (min_score) {
      query += ` AND overall_score >= $${paramCount}`;
      params.push(parseInt(min_score));
      paramCount++;
    }

    if (max_score) {
      query += ` AND overall_score <= $${paramCount}`;
      params.push(parseInt(max_score));
      paramCount++;
    }

    if (category) {
      query += ` AND category ILIKE $${paramCount}`;
      params.push(`%${category}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Count total
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await req.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Sorting
    const validSortFields = ['overall_score', 'temperature', 'price', 'scraped_at', 'created_at', 'name'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'overall_score';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortDirection} NULLS LAST`;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await req.db.query(query, params);

    res.json({
      success: true,
      products: result.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching discovery products:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/products/discovery/platforms - Get available platforms
router.get('/discovery/platforms', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT DISTINCT COALESCE(network, platform, 'Unknown') as platform
       FROM products
       WHERE COALESCE(network, platform) IS NOT NULL
       ORDER BY platform`
    );
    res.json({
      success: true,
      platforms: result.rows.map(r => r.platform)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/discovery/categories - Get available categories
router.get('/discovery/categories', async (req, res) => {
  try {
    const result = await req.db.query(
      `SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category`
    );
    res.json({
      success: true,
      categories: result.rows.map(r => r.category)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/products/discovery/:id - Get single discovery product
router.get('/discovery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/products/discovery/:id - Update discovery product
router.patch('/discovery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'commission_rate', 'commission_amount', 'is_affiliated', 'affiliate_link',
      'user_notes', 'stage', 'category'
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
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    // Track affiliation
    if (updates.is_affiliated && !updates.affiliated_at) {
      setClause.push(`affiliated_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;
    }

    setClause.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);
    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await req.db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/discovery/:id/promote - Promote product to Offers
router.post('/discovery/:id/promote', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = existing.rows[0];

    // Generate promotion data (placeholder - integrate with AI agent later)
    const promotionSummary = `${product.name} is a high-potential product in the ${product.category || 'digital products'} niche with strong demand indicators.`;
    const targetAudience = 'Adults 25-45 interested in self-improvement and digital solutions.';
    const promotionStrategy = 'Focus on Facebook/Instagram ads highlighting transformation and results. Use testimonials and before/after comparisons.';
    const roiProjection = {
      min: 80,
      avg: 180,
      max: 350,
      assumptions: [
        'Based on industry benchmarks',
        '$500 initial ad spend',
        `${product.temperature || 50}° temperature indicates moderate-high demand`,
        'Assumes 2% conversion rate'
      ]
    };

    const result = await req.db.query(
      `UPDATE products SET
        is_promoted = true,
        promoted_at = $1,
        stage = 'offer',
        promotion_summary = $2,
        target_audience = $3,
        promotion_strategy = $4,
        roi_projection = $5,
        updated_at = $1
      WHERE id = $6
      RETURNING *`,
      [new Date(), promotionSummary, targetAudience, promotionStrategy, JSON.stringify(roiProjection), id]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Error promoting product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/discovery/:id/analyze - Deep analysis
router.post('/discovery/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = existing.rows[0];

    // Placeholder analysis - replace with actual AI call
    const analysis = {
      summary: `${product.name} shows strong potential based on its ${product.temperature || 'unknown'}° temperature score and competitive price point of $${product.price || 'N/A'}.`,
      target_audience: 'Primary: Adults 25-45, digitally savvy, interested in self-improvement. Secondary: Entrepreneurs and small business owners.',
      promotion_strategy: '1. Launch with Facebook ads targeting interest-based audiences\n2. Create 3-5 ad variations for A/B testing\n3. Focus on pain points and transformation\n4. Use video content for higher engagement\n5. Retarget website visitors within 7 days',
      roi_projection: {
        min: 50,
        avg: 150,
        max: 300,
        assumptions: [
          'Industry average conversion rates',
          '$500 test budget',
          'Based on similar products in this niche'
        ]
      }
    };

    // Update product with analysis
    await req.db.query(
      `UPDATE products SET
        promotion_summary = $1,
        target_audience = $2,
        promotion_strategy = $3,
        roi_projection = $4,
        updated_at = $5
      WHERE id = $6`,
      [analysis.summary, analysis.target_audience, analysis.promotion_strategy, JSON.stringify(analysis.roi_projection), new Date(), id]
    );

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/discovery/:id/archive - Archive product
router.post('/discovery/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await req.db.query(
      `UPDATE products SET stage = 'archived', updated_at = $1 WHERE id = $2 RETURNING *`,
      [new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/products/discovery/rescore - Rescore products
router.post('/discovery/rescore', async (req, res) => {
  try {
    const { ids } = req.body;

    // Placeholder - in production, this would trigger AI scoring
    let query = 'SELECT id FROM products WHERE 1=1';
    const params = [];

    if (ids && Array.isArray(ids) && ids.length > 0) {
      query += ` AND id = ANY($1)`;
      params.push(ids);
    }

    const result = await req.db.query(query, params);
    const count = result.rows.length;

    // For now, just update the updated_at timestamp
    if (count > 0) {
      const idsToUpdate = result.rows.map(r => r.id);
      await req.db.query(
        `UPDATE products SET updated_at = $1 WHERE id = ANY($2)`,
        [new Date(), idsToUpdate]
      );
    }

    res.json({ success: true, count, message: `${count} products queued for rescoring` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch product', details: error.message }
    });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      image_url,
      affiliate_link,
      commission_rate,
      source,
      source_id,
      status,
      notes
    } = req.body;
    const result = await req.db.query(
      `INSERT INTO products (
        name, description, price, currency, image_url,
        affiliate_link, commission_rate, source, source_id, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name, description, price, currency || 'USD', image_url,
        affiliate_link, commission_rate, source, source_id, status || 'active', notes
      ]
    );;

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create product', details: error.message }
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'description', 'seo_description', 'price', 'currency', 'image_url',
      'affiliate_link', 'commission_rate', 'category', 'subcategory', 'tags',
      'network', 'network_product_id', 'is_active'
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
    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await req.db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update product', details: error.message }
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Product not found' }
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete product', details: error.message }
    });
  }
});


});

module.exports = router;
