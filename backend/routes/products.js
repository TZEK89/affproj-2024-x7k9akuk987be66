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
      seo_description,
      price,
      currency,
      image_url,
      affiliate_link,
      commission_rate,
      category,
      subcategory,
      tags,
      network,
      network_product_id,
      is_active
    } = req.body;

    const result = await req.db.query(
      `INSERT INTO products (
        name, description, seo_description, price, currency, image_url,
        affiliate_link, commission_rate, category, subcategory, tags,
        network, network_product_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        name, description, seo_description, price, currency || 'USD', image_url,
        affiliate_link, commission_rate, category, subcategory, tags,
        network, network_product_id, is_active !== undefined ? is_active : true
      ]
    );

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

module.exports = router;
