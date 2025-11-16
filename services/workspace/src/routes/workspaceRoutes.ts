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
import { strictLimiter } from '../middleware/rateLimitter';

const router = Router();

// ✅ Apply authentication to ALL routes
router.use(authenticate);

// ✅ Workspace CRUD (order matters - specific before general)
router.post('/', strictLimiter, createWorkspace); // ⚠️ No extra middleware on POST
router.get('/', getWorkspaces);
router.get('/:workspaceId', isWorkspaceMember, getWorkspaceById);
router.put('/:workspaceId', isWorkspaceAdmin, strictLimiter, updateWorkspace);
router.delete('/:workspaceId', isWorkspaceAdmin, strictLimiter, deleteWorkspace);

// ✅ Member management
router.get('/:workspaceId/members', isWorkspaceMember, getWorkspaceMembers);
router.post('/:workspaceId/invite', isWorkspaceAdmin, inviteMember);
router.delete('/:workspaceId/members/:memberId', isWorkspaceAdmin, removeMember);

export default router;