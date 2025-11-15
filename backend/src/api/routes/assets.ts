import { Router } from 'express';
import Joi from 'joi';
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStatsByTool,
  getAssetPerformance,
} from '../controllers/assetsController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';

const router = Router();

// Validation schemas
const createAssetSchema = Joi.object({
  offer_id: Joi.number().integer(),
  type: Joi.string().valid('image', 'video', 'audio', 'text').required(),
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().allow(''),
  file_url: Joi.string().uri().required(),
  file_size: Joi.number().integer().min(0),
  file_format: Joi.string().max(50),
  dimensions: Joi.string().max(50),
  duration: Joi.number().min(0),
  ai_tool: Joi.string().max(100),
  ai_prompt: Joi.string(),
  ai_settings: Joi.object(),
  metadata: Joi.object(),
});

const updateAssetSchema = Joi.object({
  name: Joi.string().min(3).max(255),
  description: Joi.string().allow(''),
  file_url: Joi.string().uri(),
  file_size: Joi.number().integer().min(0),
  file_format: Joi.string().max(50),
  dimensions: Joi.string().max(50),
  duration: Joi.number().min(0),
  ai_prompt: Joi.string(),
  ai_settings: Joi.object(),
  metadata: Joi.object(),
}).min(1);

const getAssetsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  type: Joi.string().valid('image', 'video', 'audio', 'text'),
  ai_tool: Joi.string(),
  offer_id: Joi.number().integer(),
  sort_by: Joi.string().valid('created_at', 'type', 'ai_tool', 'name'),
  sort_order: Joi.string().valid('ASC', 'DESC'),
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().required(),
});

// Routes
router.get('/stats/by-tool', authenticate, getAssetStatsByTool);
router.get('/', authenticate, validateQuery(getAssetsQuerySchema), getAssets);
router.get('/:id', authenticate, validateParams(idParamSchema), getAsset);
router.get('/:id/performance', authenticate, validateParams(idParamSchema), getAssetPerformance);
router.post('/', authenticate, authorize('admin', 'user'), validate(createAssetSchema), createAsset);
router.put('/:id', authenticate, authorize('admin', 'user'), validateParams(idParamSchema), validate(updateAssetSchema), updateAsset);
router.delete('/:id', authenticate, authorize('admin'), validateParams(idParamSchema), deleteAsset);

export default router;

