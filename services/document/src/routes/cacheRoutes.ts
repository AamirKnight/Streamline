import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import cacheClient from '../utils/redis';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate);

// Get cache stats
router.get('/stats', async (req, res) => {
  try {
    const dbSize = await cacheClient.dbSize();
    const info = await cacheClient.info();
    
    res.json({
      connected: cacheClient.isReady,
      totalKeys: dbSize,
      info: info,
    });
  } catch (error: any) {
    logger.error('Cache stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear all cache
router.post('/clear', async (req, res) => {
  try {
    await cacheClient.flushDb();
    logger.info('Cache cleared by user', { userId: req.user?.id });
    res.json({ message: 'Cache cleared successfully' });
  } catch (error: any) {
    logger.error('Cache clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific cache key
router.get('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const data = await cacheClient.get(key);
    
    if (!data) {
      return res.status(404).json({ error: 'Key not found' });
    }

    res.json({
      key,
      value: JSON.parse(data),
    });
  } catch (error: any) {
    logger.error('Cache get key error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete specific cache key
router.delete('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await cacheClient.del(key);
    
    logger.info('Cache key deleted', { key, userId: req.user?.id });
    res.json({ message: 'Cache key deleted' });
  } catch (error: any) {
    logger.error('Cache delete key error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all keys (for debugging - use cautiously in production)
router.get('/keys', async (req, res) => {
  try {
    const pattern = req.query.pattern as string || '*';
    const keys = await cacheClient.keys(pattern);
    
    res.json({
      pattern,
      count: keys.length,
      keys: keys.slice(0, 100), // Limit to 100 keys
    });
  } catch (error: any) {
    logger.error('Cache keys error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;