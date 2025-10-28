import { createClient } from 'redis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cacheClient = createClient({ url: redisUrl });

cacheClient.on('error', (err) => logger.error('Redis Cache Error:', err));

export const connectCache = async () => {
  try {
    await cacheClient.connect();
    logger.info('✅ Redis cache connected');
  } catch (error) {
    logger.error('❌ Redis cache connection error:', error);
  }
};

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await cacheClient.get(key);
      if (data) {
        logger.debug('Cache HIT', { key });
        return JSON.parse(data) as T;
      }
      logger.debug('Cache MISS', { key });
      return null;
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await cacheClient.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache SET', { key, ttl });
    } catch (error) {
      logger.error('Cache SET error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await cacheClient.del(key);
      logger.debug('Cache DEL', { key });
    } catch (error) {
      logger.error('Cache DEL error:', error);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await cacheClient.keys(pattern);
      if (keys.length > 0) {
        await cacheClient.del(keys);
        logger.debug('Cache DEL pattern', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache DEL pattern error:', error);
    }
  },
};

export default cacheClient;