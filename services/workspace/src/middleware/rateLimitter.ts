import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // ⬆️ Increased from 100 to 200
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  
  // ✅ Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
  
  // ✅ Better key generation for production
  keyGenerator: (req) => {
    // Use X-Forwarded-For in production (Vercel/Railway)
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  },
  
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path,
      headers: req.headers 
    });
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // ⬆️ Increased from 20 to 50
  message: 'Too many write operations, please slow down.',
  
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || 'unknown';
  },
  
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many write operations. Please slow down.',
      retryAfter: 15 * 60,
    });
  },
});