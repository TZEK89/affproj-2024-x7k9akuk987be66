import { Router } from 'express';
import Joi from 'joi';
import {
  trackClick,
  trackConversion,
  updateConversionStatus,
  getClicks,
  getConversions,
} from '../controllers/trackingController';
import { optionalAuth } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const router = Router();

// Validation schemas
const trackClickSchema = Joi.object({
  campaign_id: Joi.number().integer().required(),
  offer_id: Joi.number().integer().required(),
  landing_page_id: Joi.number().integer(),
  user_agent: Joi.string(),
  ip_address: Joi.string().ip(),
  referrer: Joi.string().uri().allow(''),
  utm_source: Joi.string().max(100),
  utm_medium: Joi.string().max(100),
  utm_campaign: Joi.string().max(100),
  utm_content: Joi.string().max(100),
  utm_term: Joi.string().max(100),
  device_type: Joi.string().valid('desktop', 'mobile', 'tablet'),
  browser: Joi.string().max(100),
  os: Joi.string().max(100),
  country: Joi.string().length(2),
  city: Joi.string().max(100),
  metadata: Joi.object(),
});

const trackConversionSchema = Joi.object({
  click_id: Joi.string().required(),
  external_id: Joi.string().max(100),
  order_id: Joi.string().max(100),
  order_value: Joi.number().min(0),
  commission_amount: Joi.number().min(0),
  commission_percentage: Joi.number().min(0).max(100),
  currency: Joi.string().length(3),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'reversed'),
  metadata: Joi.object(),
});

const updateConversionStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'reversed').required(),
  reason: Joi.string().allow(''),
});

const getClicksQuerySchema = Joi.object({
  campaign_id: Joi.number().integer(),
  offer_id: Joi.number().integer(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  start_date: Joi.date(),
  end_date: Joi.date(),
});

const getConversionsQuerySchema = Joi.object({
  campaign_id: Joi.number().integer(),
  offer_id: Joi.number().integer(),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'reversed'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  start_date: Joi.date(),
  end_date: Joi.date(),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required(),
});

// Public routes (no auth required for tracking pixels/webhooks)
router.post('/click', validate(trackClickSchema), trackClick);
router.post('/conversion', validate(trackConversionSchema), trackConversion);
router.patch('/conversion/:id/status', validateParams(idParamSchema), validate(updateConversionStatusSchema), updateConversionStatus);

// Protected routes (for viewing tracking data)
router.get('/clicks', optionalAuth, validateQuery(getClicksQuerySchema), getClicks);
router.get('/conversions', optionalAuth, validateQuery(getConversionsQuerySchema), getConversions);

export default router;

