import { Router } from 'express';
import Joi from 'joi';
import {
  getDashboardOverview,
  getRevenueByPlatform,
  getRevenueByNiche,
  getConversionFunnel,
  getPerformanceByTime,
  getCohortAnalysis,
  getHealthAlerts,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';

const router = Router();

// Validation schemas
const daysQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365),
});

const funnelQuerySchema = Joi.object({
  campaign_id: Joi.number().integer(),
  days: Joi.number().integer().min(1).max(365),
});

const timePerformanceQuerySchema = Joi.object({
  grouping: Joi.string().valid('hour', 'day', 'week', 'month'),
  days: Joi.number().integer().min(1).max(365),
});

// Routes
router.get('/dashboard', authenticate, validateQuery(daysQuerySchema), getDashboardOverview);
router.get('/revenue/by-platform', authenticate, validateQuery(daysQuerySchema), getRevenueByPlatform);
router.get('/revenue/by-niche', authenticate, validateQuery(daysQuerySchema), getRevenueByNiche);
router.get('/funnel', authenticate, validateQuery(funnelQuerySchema), getConversionFunnel);
router.get('/performance/by-time', authenticate, validateQuery(timePerformanceQuerySchema), getPerformanceByTime);
router.get('/cohorts', authenticate, getCohortAnalysis);
router.get('/alerts', authenticate, getHealthAlerts);

export default router;

