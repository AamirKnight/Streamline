import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { createClient } from 'redis';
import logger from '../utils/logger';

// 🔌 Connect to Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch((err) => {
  console.error('Redis connection failed:', err);
});

// ----------------------------
// 🧩 General API Rate Limiter
// ----------------------------
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // Skip health checks
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// ----------------------------
// 🔒 Strict Limiter for Writes
// ----------------------------
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 writes per window
  message: 'Too many write operations, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Too many write operations. Please slow down.',
      retryAfter: 15 * 60,
    });
  },
});

// ----------------------------
// 🧾 Document Creation Limiter
// ----------------------------
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 document creations per hour
  message: 'Too many documents created, try again later.',
  keyGenerator: (req: Request) => {
    // ✅ Use IPv6-safe key generator
    const ipKey = ipKeyGenerator(req as any);
    const userId = (req as any).user?.id;
    return `create:${userId || ipKey}`;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Create rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
    });
    res.status(429).json({
      error: 'You have created too many documents. Please try again later.',
      retryAfter: 60 * 60,
    });
  },
});
