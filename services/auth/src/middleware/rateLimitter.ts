import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

redisClient.connect().catch(console.error);

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_REQUESTS = 5; // Max 5 login attempts per minute

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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