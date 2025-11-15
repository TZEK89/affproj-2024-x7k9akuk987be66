import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';

/**
 * Custom Error Class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Handler Middleware
 * Catches all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default to 500 server error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error', {
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode,
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

