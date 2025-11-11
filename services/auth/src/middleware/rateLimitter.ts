// services/auth/src/middleware/rateLimitter.ts
import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

// Use REDIS_URL from environment
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Only connect if Redis URL is available
if (process.env.REDIS_URL) {
  redisClient.connect().catch(console.error);
} else {
  console.warn('⚠️  Redis not configured - rate limiting disabled');
}

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 5; // Max 5 login attempts per minute

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!process.env.REDIS_URL) {
    return next();
  }
  // Skip if Redis not connected
  if (!redisClient.isReady) {
    console.warn('Rate limiter: Redis not connected, skipping');
    return next();
  }

  try {
    const key = `login:${req.ip}`;
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW);
    }

    if (count > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many login attempts. Try again later.',
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Continue even if rate limiter fails
  }
};