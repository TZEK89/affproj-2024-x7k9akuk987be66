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
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
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

// Import middleware
const authMiddleware = require('./middleware/auth');
const mockUser = require('./middleware/mock-user');

// Add database to request object
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Add mock user for personal use (no auth required)
app.use(mockUser);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
const hotmartWebhookRoutes = require('./routes/webhooks/hotmart');
const hotmartRoutes = require('./routes/hotmart');
const productImagesRoutes = require('./routes/productImages');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const agentsRoutes = require('./routes/agents');
const agentsExecuteRoutes = require('./routes/agents-execute');
const browserController = require('./routes/browserController');
const agenticRoutes = require('./routes/agenticRoutes');
const brightdataRoutes = require('./routes/brightdata');
const hotmartBrowserRoutes = require('./routes/hotmart-browser');
const commandCenterRoutes = require('./routes/command-center');
const agentManagementRoutes = require('./routes/agent-management');
const agentAnalyticsRoutes = require('./routes/agent-analytics');
const platformConnectionsRoutes = require('./routes/platform-connections');

// Import job system for agent missions
let jobSystem = null;
try {
  jobSystem = require('./jobs');
  console.log('📦 Job system module loaded');
} catch (error) {
  console.warn('⚠️ Job system module not available:', error.message);
}

// Health check endpoint (improved to actually test database)
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    
    // Get job system status
    let queueStatus = null;
    if (jobSystem) {
      try {
        queueStatus = await jobSystem.healthCheck();
      } catch (e) {
        queueStatus = { healthy: false, error: e.message };
      }
    }
    
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
      dbTime: dbResult.rows[0].now,
      jobSystem: queueStatus || { status: 'not_configured' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Webhook routes (no auth - must be accessible by external services)
app.use('/api/webhooks/impact', impactWebhookRoutes);
app.use('/api/webhooks/hotmart', hotmartWebhookRoutes);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Admin routes (some public, some protected)
app.use('/api/admin', adminRoutes);

// All routes public for personal use (no auth required)
app.use('/api/products', productsRoutes);
app.use('/api/landing-pages', landingPagesRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/subscribers', subscribersRoutes);
app.use('/api/conversions', conversionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/hotmart', hotmartRoutes);
app.use('/api/product-images', productImagesRoutes);

// Public routes that have mixed auth (some endpoints public, some protected)
app.use('/api/integrations', integrationsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/agents', agentsExecuteRoutes);
app.use('/api/browser', browserController);
app.use('/api/agentic', agenticRoutes);
app.use('/api/brightdata', brightdataRoutes);
app.use('/api/hotmart-browser', hotmartBrowserRoutes);
app.use('/api/command-center', commandCenterRoutes);
app.use('/api/agent-management', agentManagementRoutes);
app.use('/api/agent-analytics', agentAnalyticsRoutes);
app.use('/api/platform-connections', platformConnectionsRoutes);

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
      ai: '/api/ai',
      agents: '/api/agents',
      brightdata: '/api/brightdata',
      hotmart_browser: '/api/hotmart-browser'
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

// Initialize Bright Data service
const BrightDataService = require('./services/BrightDataService');
const brightDataService = new BrightDataService();

// Initialize Hotmart Login service
const HotmartLoginService = require('./services/HotmartLoginService');
const hotmartLoginService = new HotmartLoginService(brightDataService);
const { setHotmartLoginService } = require('./routes/hotmart-browser');
setHotmartLoginService(hotmartLoginService);

// Initialize job system and start server
const startServer = async () => {
  // Initialize Bright Data service
  try {
    console.log('🌐 Initializing Bright Data service...');
    const brightDataInit = await brightDataService.initialize();
    if (brightDataInit.success) {
      console.log('✅ Bright Data service initialized successfully');
      // Make service available globally
      global.BrightDataService = brightDataService;
    } else {
      console.warn('⚠️ Bright Data service initialization failed:', brightDataInit.error);
      console.log('⚠️ Server will continue without Bright Data scraping');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Bright Data:', error.message);
    console.log('⚠️ Server will continue without Bright Data scraping');
  }

  // Initialize job system if available
  if (jobSystem) {
    try {
      const initialized = await jobSystem.initialize({ startWorkers: true });
      if (initialized) {
        console.log('✅ Agent job system initialized with workers');
      } else {
        console.log('⚠️ Agent job system running in degraded mode (Redis not available)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize job system:', error.message);
      console.log('⚠️ Server will continue without job processing');
    }
  }

  // Start HTTP server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`📮 Redis: ${process.env.REDIS_URL ? 'Configured' : 'Not configured'}`);
  });

  // Graceful shutdown handler
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} signal received: starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      console.log('HTTP server closed');

      // Shutdown job system if initialized
      if (jobSystem && jobSystem.isInitialized && jobSystem.isInitialized()) {
        try {
          await jobSystem.shutdown();
          console.log('Job system shut down');
        } catch (error) {
          console.error('Error shutting down job system:', error.message);
        }
      }

      // Close database pool
      try {
        await pool.end();
        console.log('Database pool closed');
      } catch (error) {
        console.error('Error closing database pool:', error.message);
      }

      console.log('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

