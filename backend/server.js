const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add database to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import middleware
const authMiddleware = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const landingPagesRoutes = require('./routes/landingPages');
const campaignsRoutes = require('./routes/campaigns');
const subscribersRoutes = require('./routes/subscribers');
const conversionsRoutes = require('./routes/conversions');
const analyticsRoutes = require('./routes/analytics');
const integrationsRoutes = require('./routes/integrations');
const impactWebhookRoutes = require('./routes/webhooks/impact');
const hotmartRoutes = require('./routes/hotmart');
const productImagesRoutes = require('./routes/productImages');
const aiRoutes = require('./routes/ai');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: pool.totalCount > 0 ? 'connected' : 'disconnected'
  });
});

// API routes
// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/webhooks/impact', impactWebhookRoutes); // Webhooks don't need auth

// Protected routes (auth required)
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/landing-pages', authMiddleware, landingPagesRoutes);
app.use('/api/campaigns', authMiddleware, campaignsRoutes);
app.use('/api/subscribers', authMiddleware, subscribersRoutes);
app.use('/api/conversions', authMiddleware, conversionsRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/integrations', authMiddleware, integrationsRoutes);
app.use('/api/hotmart', authMiddleware, hotmartRoutes);
app.use('/api/products', authMiddleware, productImagesRoutes);
app.use('/api/ai', aiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Affiliate Marketing System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      landing_pages: '/api/landing-pages',
      campaigns: '/api/campaigns',
      subscribers: '/api/subscribers',
      conversions: '/api/conversions',
      analytics: '/api/analytics',
      integrations: '/api/integrations',
      hotmart: '/api/hotmart',
      product_images: '/api/products/:id/images',
      ai: '/api/ai'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.path}`
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
