import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';

import logger from './config/logger';
import { testConnection } from './config/database';
import { initRedis } from './config/redis';
import routes from './api/routes';
import { errorHandler } from './api/middleware/errorHandler';
import { notFoundHandler } from './api/middleware/notFoundHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware Setup
 */

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * Health Check Endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * API Routes
 */
app.use('/api', routes);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Initialize and Start Server
 */
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize Redis
    logger.info('Initializing Redis...');
    await initRedis();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`💚 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

