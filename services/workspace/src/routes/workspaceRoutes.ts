import { Router } from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  inviteMember,
  removeMember,
} from '../controllers/workspaceController';
import { authenticate } from '../middleware/auth';
import { isWorkspaceMember, isWorkspaceAdmin } from '../middleware/workspace';

const router = Router();

// All routes require authentication
router.use(authenticate);



import { strictLimiter } from '../middleware/rateLimitter';

router.post('/', authenticate, strictLimiter, createWorkspace);
router.put('/:workspaceId', authenticate, isWorkspaceAdmin, strictLimiter, updateWorkspace);
router.delete('/:workspaceId', authenticate, isWorkspaceAdmin, strictLimiter, deleteWorkspace);
// Workspace CRUD

router.get('/', getWorkspaces);
router.get('/:workspaceId', isWorkspaceMember, getWorkspaceById);

// Member management
router.get('/:workspaceId/members', isWorkspaceMember, getWorkspaceMembers);
router.post('/:workspaceId/invite', isWorkspaceAdmin, inviteMember);
router.delete('/:workspaceId/members/:memberId', isWorkspaceAdmin, removeMember);

export default router;