import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './errorHandler';

/**
 * Validation Middleware Factory
 * Creates middleware to validate request data against Joi schema
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(`Validation error: ${errorMessage}`, 400));
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

/**
 * Validate Query Parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(`Query validation error: ${errorMessage}`, 400));
    }

    req.query = value;
    next();
  };
};

/**
 * Validate URL Parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(new AppError(`Parameter validation error: ${errorMessage}`, 400));
    }

    req.params = value;
    next();
  };
};

