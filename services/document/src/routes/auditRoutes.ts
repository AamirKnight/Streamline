import { Router } from 'express';
import {
  getAuditLogs,
  getDocumentTimeline,
  verifyAuditIntegrity,
  exportAuditLogs,
} from '../controllers/auditController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/logs', getAuditLogs);
router.get('/documents/:documentId/timeline', getDocumentTimeline);
router.get('/documents/:documentId/verify', verifyAuditIntegrity);
router.get('/export', exportAuditLogs);

export default router;