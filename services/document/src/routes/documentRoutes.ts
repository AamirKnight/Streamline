import { Router } from 'express';
import {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  searchDocuments,
} from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { verifyWorkspaceAccess } from '../middleware/workspace';
import { strictLimiter, createLimiter } from '../middleware/rateLimitter';
import { documentValidation } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Document CRUD

router.get('/', getDocuments);
router.get('/search', searchDocuments);

// Apply strict limiters to write operations
router.post('/', authenticate, verifyWorkspaceAccess, createLimiter, documentValidation.create, createDocument);
router.get('/:documentId', authenticate, documentValidation.getById, getDocumentById);
router.put('/:documentId', authenticate, strictLimiter, documentValidation.update, updateDocument);

router.delete('/:documentId', authenticate, strictLimiter, deleteDocument);
// Version history
router.get('/:documentId/versions', getDocumentVersions);





export default router;