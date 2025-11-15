import { Router } from 'express';
import authRoutes from './auth';
import offersRoutes from './offers';
import campaignsRoutes from './campaigns';
import assetsRoutes from './assets';
import landingPagesRoutes from './landingPages';
import analyticsRoutes from './analytics';
import trackingRoutes from './tracking';
import { apiLimiter } from '../middleware/rateLimit';

const router = Router();

// Apply rate limiting to all API routes (except tracking endpoints)
router.use('/auth', apiLimiter);
router.use('/offers', apiLimiter);
router.use('/campaigns', apiLimiter);
router.use('/assets', apiLimiter);
router.use('/landing-pages', apiLimiter);
router.use('/analytics', apiLimiter);

// Health check (no auth required)
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/offers', offersRoutes);
router.use('/campaigns', campaignsRoutes);
router.use('/assets', assetsRoutes);
router.use('/landing-pages', landingPagesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/track', trackingRoutes); // No rate limiting for tracking (high volume)

export default router;

