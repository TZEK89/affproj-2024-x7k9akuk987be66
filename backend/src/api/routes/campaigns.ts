import { Router } from 'express';
import Joi from 'joi';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  updateCampaignBudget,
  deleteCampaign,
  getCampaignStats,
  getCampaignPerformance,
  getCampaignHealth,
} from '../controllers/campaignsController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const router = Router();

// Validation schemas
const createCampaignSchema = Joi.object({
  offer_id: Joi.number().integer().required(),
  platform_id: Joi.number().integer().required(),
  landing_page_id: Joi.number().integer(),
  external_id: Joi.string().max(100),
  name: Joi.string().min(3).max(255).required(),
  budget_daily: Joi.number().min(0),
  budget_total: Joi.number().min(0),
  bid_strategy: Joi.string().max(50),
  targeting: Joi.object(),
  start_date: Joi.date(),
  end_date: Joi.date().greater(Joi.ref('start_date')),
  asset_ids: Joi.array().items(Joi.number().integer()),
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  budget_daily: Joi.number().min(0),
  budget_total: Joi.number().min(0),
  bid_strategy: Joi.string().max(50),
  targeting: Joi.object(),
  start_date: Joi.date(),
  end_date: Joi.date(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'archived').required(),
});

const updateBudgetSchema = Joi.object({
  budget_daily: Joi.number().min(0),
  budget_total: Joi.number().min(0),
}).min(1);

const getCampaignsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'archived'),
  platform_id: Joi.number().integer(),
  offer_id: Joi.number().integer(),
  min_roas: Joi.number().min(0),
  sort_by: Joi.string().valid('roas', 'spend', 'revenue', 'profit', 'created_at', 'name'),
  sort_order: Joi.string().valid('ASC', 'DESC'),
});

const getStatsQuerySchema = Joi.object({
  days: Joi.number().integer().min(1).max(365),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required(),
});

// Routes
router.get('/performance', authenticate, getCampaignPerformance);
router.get('/health', authenticate, getCampaignHealth);
router.get('/', authenticate, validateQuery(getCampaignsQuerySchema), getCampaigns);
router.get('/:id', authenticate, validateParams(idParamSchema), getCampaign);
router.get('/:id/stats', authenticate, validateParams(idParamSchema), validateQuery(getStatsQuerySchema), getCampaignStats);
router.post('/', authenticate, authorize('admin', 'user'), validate(createCampaignSchema), createCampaign);
router.put('/:id', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateCampaignSchema), updateCampaign);
router.patch('/:id/status', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateStatusSchema), updateCampaignStatus);
router.patch('/:id/budget', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateBudgetSchema), updateCampaignBudget);
router.delete('/:id', authenticate, authorize('admin'), validateParams(idParamSchema), deleteCampaign);

export default router;

