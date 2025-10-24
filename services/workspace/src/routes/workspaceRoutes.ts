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

// Workspace CRUD
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:workspaceId', isWorkspaceMember, getWorkspaceById);
router.put('/:workspaceId', isWorkspaceAdmin, updateWorkspace);
router.delete('/:workspaceId', isWorkspaceAdmin, deleteWorkspace);

// Member management
router.get('/:workspaceId/members', isWorkspaceMember, getWorkspaceMembers);
router.post('/:workspaceId/invite', isWorkspaceAdmin, inviteMember);
router.delete('/:workspaceId/members/:memberId', isWorkspaceAdmin, removeMember);

export default router;