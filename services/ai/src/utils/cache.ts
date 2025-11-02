import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import logger from './logger';

let cacheClient: RedisClientType | null = null;

export const connectCache = async (): Promise<void> => {
  if (cacheClient && cacheClient.isReady) return; // already connected

  try {
    cacheClient = createClient({ url: config.redis.url });

    cacheClient.on('error', (err) => logger.error('Redis Cache Error:', err));

    await cacheClient.connect();
    logger.info('✅ Redis cache connected');
  } catch (error) {
    logger.error('❌ Redis cache connection error:', error);
  }
};

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!cacheClient || !cacheClient.isReady) {
      logger.warn('Cache GET skipped: client not connected');
      return null;
    }

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
    if (!cacheClient || !cacheClient.isReady) {
      logger.warn('Cache SET skipped: client not connected');
      return;
    }

    try {
      await cacheClient.setEx(key, ttl, JSON.stringify(value));
      logger.debug('Cache SET', { key, ttl });
    } catch (error) {
      logger.error('Cache SET error:', error);
    }
  },

  async del(key: string): Promise<void> {
    if (!cacheClient || !cacheClient.isReady) {
      logger.warn('Cache DEL skipped: client not connected');
      return;
    }

    try {
      await cacheClient.del(key);
      logger.debug('Cache DEL', { key });
    } catch (error) {
      logger.error('Cache DEL error:', error);
    }
  },
};

export const getCacheClient = (): RedisClientType | null => cacheClient;

export default cache;
