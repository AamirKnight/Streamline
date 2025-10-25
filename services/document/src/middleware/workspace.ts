import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';

export const verifyWorkspaceAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.body.workspaceId || req.query.workspaceId;
    const userId = req.user?.id;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user has access to workspace
    try {
      const token = req.headers.authorization?.substring(7);
      await axios.get(
        `${config.workspaceServiceUrl}/workspaces/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // If request succeeds, user has access
      next();
    } catch (error: any) {
      if (error.response?.status === 403) {
        return res.status(403).json({ error: 'Not a member of this workspace' });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};