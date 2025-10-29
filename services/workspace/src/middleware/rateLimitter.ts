import rateLimit from 'express-rate-limit';
import logger from '../utils/logger';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many write operations, please slow down.',
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({
      error: 'Too many write operations. Please slow down.',
      retryAfter: 15 * 60,
    });
  },
});