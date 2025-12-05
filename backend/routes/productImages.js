const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ImageGenerationService = require('../services/imageGenerationService');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/product-images');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * Generate image for a product
 * POST /api/products/:id/images/generate
 */
router.post('/:id/images/generate', async (req, res) => {
  try {
    const productId = req.params.id;
    const { customPrompt } = req.body;

    // Get product details
    const productResult = await req.db.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Generate image
    const imageService = new ImageGenerationService();
    const imageResult = await imageService.generateProductCover(
      {
        name: product.name,
        format: product.category || 'ONLINE_COURSE',
        description: product.description
      },
      customPrompt
    );

    // Update product with new image URL
    await req.db.query(
      'UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2',
      [imageResult.imageUrl, productId]
    );

    // Save to image history
    await req.db.query(
      `INSERT INTO product_image_history (product_id, image_url, generation_method, prompt, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [productId, imageResult.imageUrl, 'ai_generated', imageResult.prompt]
    );

    res.json({
      success: true,
      message: 'Image generated successfully',
      image: {
        url: imageResult.imageUrl,
        prompt: imageResult.prompt,
        revisedPrompt: imageResult.revisedPrompt
      }
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate image',
      error: error.message
    });
  }
});

/**
 * Upload custom image for a product
 * POST /api/products/:id/images/upload
 */
router.post('/:id/images/upload', upload.single('image'), async (req, res) => {
  try {
    const productId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if product exists
    const productResult = await req.db.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Generate public URL for the uploaded image
    const imageUrl = `/uploads/product-images/${req.file.filename}`;

    // Update product with new image URL
    await req.db.query(
      'UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2',
      [imageUrl, productId]
    );

    // Save to image history
    await req.db.query(
      `INSERT INTO product_image_history (product_id, image_url, generation_method, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [productId, imageUrl, 'manual_upload']
    );

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    // Try to delete the uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

/**
 * Get image history for a product
 * GET /api/products/:id/images/history
 */
router.get('/:id/images/history', async (req, res) => {
  try {
    const productId = req.params.id;

    const result = await req.db.query(
      `SELECT * FROM product_image_history 
       WHERE product_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [productId]
    );

    res.json({
      success: true,
      images: result.rows
    });

  } catch (error) {
    console.error('Error fetching image history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image history',
      error: error.message
    });
  }
});

/**
 * Update product image URL
 * PUT /api/products/:id/images
 */
router.put('/:id/images', async (req, res) => {
  try {
    const productId = req.params.id;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Update product
    const result = await req.db.query(
      'UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [imageUrl, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Image updated successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: error.message
    });
  }
});

/**
 * Delete product image (set to placeholder)
 * DELETE /api/products/:id/images
 */
router.delete('/:id/images', async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product to determine format
    const productResult = await req.db.query(
      'SELECT category FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    const imageService = new ImageGenerationService();
    const placeholderUrl = imageService.getPlaceholderImage(product.category || 'ONLINE_COURSE');

    // Update product with placeholder
    await req.db.query(
      'UPDATE products SET image_url = $1, updated_at = NOW() WHERE id = $2',
      [placeholderUrl, productId]
    );

    res.json({
      success: true,
      message: 'Image removed, placeholder set',
      image: {
        url: placeholderUrl
      }
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

/**
 * Add notes/comments to a product
 * POST /api/products/:id/notes
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const productId = req.params.id;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    // Add note to product metadata
    const result = await req.db.query(
      `UPDATE products 
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{notes}',
         COALESCE(metadata->'notes', '[]'::jsonb) || $1::jsonb
       ),
       updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify([{ text: note, createdAt: new Date().toISOString() }]), productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Note added successfully',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
});

module.exports = router;
