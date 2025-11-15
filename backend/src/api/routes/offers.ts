import { Router } from 'express';
import Joi from 'joi';
import {
  getOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
  getOfferStats,
} from '../controllers/offersController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const router = Router();

// Validation schemas
const createOfferSchema = Joi.object({
  network_id: Joi.number().integer().required(),
  external_id: Joi.string().max(100),
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(''),
  niche: Joi.string().max(100),
  category: Joi.string().max(100),
  commission_type: Joi.string().valid('percentage', 'fixed', 'cpa', 'cpl').required(),
  commission_value: Joi.number().min(0),
  commission_percentage: Joi.number().min(0).max(100),
  epc: Joi.number().min(0),
  conversion_rate: Joi.number().min(0).max(100),
  refund_rate: Joi.number().min(0).max(100),
  gravity: Joi.number().integer().min(0),
  landing_page_url: Joi.string().uri(),
  tracking_url: Joi.string().uri(),
  restrictions: Joi.string().allow(''),
  metadata: Joi.object(),
});

const updateOfferSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow(''),
  niche: Joi.string().max(100),
  category: Joi.string().max(100),
  commission_type: Joi.string().valid('percentage', 'fixed', 'cpa', 'cpl'),
  commission_value: Joi.number().min(0),
  commission_percentage: Joi.number().min(0).max(100),
  epc: Joi.number().min(0),
  conversion_rate: Joi.number().min(0).max(100),
  refund_rate: Joi.number().min(0).max(100),
  gravity: Joi.number().integer().min(0),
  landing_page_url: Joi.string().uri(),
  tracking_url: Joi.string().uri(),
  restrictions: Joi.string().allow(''),
  status: Joi.string().valid('active', 'inactive', 'paused', 'archived'),
  metadata: Joi.object(),
}).min(1);

const getOffersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  niche: Joi.string(),
  network_id: Joi.number().integer(),
  min_quality_score: Joi.number().integer().min(0).max(100),
  status: Joi.string().valid('active', 'inactive', 'paused', 'archived'),
  sort_by: Joi.string().valid('quality_score', 'epc', 'conversion_rate', 'created_at', 'name'),
  sort_order: Joi.string().valid('ASC', 'DESC'),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required(),
});

// Routes
router.get('/', authenticate, validateQuery(getOffersQuerySchema), getOffers);
router.get('/:id', authenticate, validateParams(idParamSchema), getOffer);
router.get('/:id/stats', authenticate, validateParams(idParamSchema), getOfferStats);
router.post('/', authenticate, authorize('admin', 'user'), validate(createOfferSchema), createOffer);
router.put('/:id', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateOfferSchema), updateOffer);
router.delete('/:id', authenticate, authorize('admin'), validateParams(idParamSchema), deleteOffer);

export default router;

