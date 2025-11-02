import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import * as searchController from '../controllers/searchController';
import * as insightsController from '../controllers/insightsController';
import * as assistantController from '../controllers/assistantController';

const router = Router();

router.use(authenticate);

// Semantic Search
router.post('/search', aiRateLimiter, searchController.semanticSearch);
router.post('/index', aiRateLimiter, searchController.indexDocument);

// Document Insights
router.get(
  '/summarize/:documentId',
  aiRateLimiter,
  insightsController.summarizeDocument
);
router.get(
  '/insights/:documentId',
  aiRateLimiter,
  insightsController.getDocumentInsights
);

// Writing Assistant
router.post('/improve', aiRateLimiter, assistantController.improveWriting);
router.post(
  '/inconsistencies',
  aiRateLimiter,
  assistantController.detectInconsistencies
);
router.post(
  '/resolve-conflict',
  aiRateLimiter,
  assistantController.resolveConflict
);
router.post('/autocomplete', aiRateLimiter, assistantController.autocomplete);

export default router;