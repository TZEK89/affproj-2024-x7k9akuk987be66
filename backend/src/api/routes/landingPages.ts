import { Router } from 'express';
import Joi from 'joi';
import {
  getLandingPages,
  getLandingPage,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  getLandingPagePerformance,
} from '../controllers/landingPagesController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const router = Router();

// Validation schemas
const createLandingPageSchema = Joi.object({
  offer_id: Joi.number().integer().required(),
  name: Joi.string().min(3).max(255).required(),
  slug: Joi.string().min(3).max(255).pattern(/^[a-z0-9-]+$/).required(),
  template: Joi.string().max(100),
  headline: Joi.string().max(500),
  subheadline: Joi.string().max(500),
  cta_text: Joi.string().max(100),
  cta_url: Joi.string().uri(),
  content: Joi.object(),
  styles: Joi.object(),
  scripts: Joi.object(),
  metadata: Joi.object(),
});

const updateLandingPageSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  template: Joi.string().max(100),
  headline: Joi.string().max(500),
  subheadline: Joi.string().max(500),
  cta_text: Joi.string().max(100),
  cta_url: Joi.string().uri(),
  content: Joi.object(),
  styles: Joi.object(),
  scripts: Joi.object(),
  metadata: Joi.object(),
  status: Joi.string().valid('active', 'inactive', 'draft'),
}).min(1);

const getLandingPagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  offer_id: Joi.number().integer(),
  template: Joi.string(),
  status: Joi.string().valid('active', 'inactive', 'draft'),
  sort_by: Joi.string().valid('created_at', 'name'),
  sort_order: Joi.string().valid('ASC', 'DESC'),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required(),
});

// Routes
router.get('/', authenticate, validateQuery(getLandingPagesQuerySchema), getLandingPages);
router.get('/:id', authenticate, validateParams(idParamSchema), getLandingPage);
router.get('/:id/performance', authenticate, validateParams(idParamSchema), getLandingPagePerformance);
router.post('/', authenticate, authorize('admin', 'user'), validate(createLandingPageSchema), createLandingPage);
router.put('/:id', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateLandingPageSchema), updateLandingPage);
router.delete('/:id', authenticate, authorize('admin'), validateParams(idParamSchema), deleteLandingPage);

export default router;

