import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many AI requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `ai:${(req as any).user?.id || req.ip}`;
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      userId: (req as any).user?.id,
      ip: req.ip,
    });
    res.status(429).json({
      error: 'Too many AI requests. Free tier limits apply.',
      retryAfter: 60,
      tip: 'Consider spacing out your requests',
    });
  },
});