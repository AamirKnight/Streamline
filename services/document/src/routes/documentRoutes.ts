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

const router = Router();

// All routes require authentication
router.use(authenticate);

// Document CRUD
router.post('/', verifyWorkspaceAccess, createDocument);
router.get('/', getDocuments);
router.get('/search', searchDocuments);
router.get('/:documentId', getDocumentById);
router.put('/:documentId', updateDocument);
router.delete('/:documentId', deleteDocument);

// Version history
router.get('/:documentId/versions', getDocumentVersions);

export default router;