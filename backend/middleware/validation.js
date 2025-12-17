/**
 * Validation Middleware
 * 
 * Centralized input validation using express-validator.
 * Provides reusable validation chains for common inputs.
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Common validation chains
 */
const validators = {
  // Platform ID validation
  platformId: body('platformId')
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('platformId must be a string between 1 and 50 characters'),

  // UUID validation
  uuid: (field) => param(field)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`),

  // LLM configuration validation
  llmProvider: body('provider')
    .isString()
    .trim()
    .isIn(['openai', 'anthropic', 'google', 'custom'])
    .withMessage('provider must be one of: openai, anthropic, google, custom'),

  llmModel: body('model')
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('model must be a string between 1 and 100 characters'),

  llmApiKey: body('apiKey')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('apiKey must be a string between 10 and 500 characters'),

  // Scraping mission validation
  scrapingGoal: body('goal')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('goal must be a string between 10 and 1000 characters'),

  // Pagination validation
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),

  offset: query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),
};

module.exports = {
  handleValidationErrors,
  validators
};
