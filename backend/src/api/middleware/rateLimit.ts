import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend Request type for rate limit
declare module 'express-serve-static-core' {
  interface Request {
    rateLimit?: {
      limit: number;
      current: number;
      remaining: number;
      resetTime: Date;
    };
  }
}

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        retryAfter: req.rateLimit?.resetTime,
      },
    });
  },
});

/**
 * Strict Rate Limiter for Authentication
 * 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Moderate Rate Limiter for Content Generation
 * 20 requests per hour
 */
export const contentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Content generation rate limit exceeded, please try again later.',
});

