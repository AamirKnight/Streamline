import { createClient } from 'redis';
import { config } from '../config';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Redis clients for Socket.io adapter
export const createRedisClients = () => {
  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => logger.error('Redis Pub Client Error:', err));
  subClient.on('error', (err) => logger.error('Redis Sub Client Error:', err));

  return { pubClient, subClient };
};

// Create Redis client for caching
export const cacheClient = createClient({ url: redisUrl });

cacheClient.on('error', (err) => logger.error('Redis Cache Client Error:', err));

export const connectRedis = async () => {
  try {
    await cacheClient.connect();
    logger.info('✅ Redis cache connected');
  } catch (error) {
    logger.error('❌ Redis connection error:', error);
  }
};

export default cacheClient;