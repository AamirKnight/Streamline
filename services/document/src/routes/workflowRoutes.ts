import { Router } from 'express';
import {
  createWorkflow,
  getWorkflow,
  transitionState,
  submitApproval,
  getPendingApprovals,
} from '../controllers/workflowController';
import { authenticate } from '../middleware/auth';
import { strictLimiter } from '../middleware/rateLimitter';

const router = Router();

router.use(authenticate);

// Workflow CRUD
router.post('/documents/:documentId/workflow', strictLimiter, createWorkflow);
router.get('/documents/:documentId/workflow', getWorkflow);

// State transitions
router.post('/documents/:documentId/workflow/transition', strictLimiter, transitionState);

// Approvals
router.post('/documents/:documentId/workflow/approve', strictLimiter, submitApproval);
router.get('/approvals/pending', getPendingApprovals);

export default router;