import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Not Found Handler Middleware
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

