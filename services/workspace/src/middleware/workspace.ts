import { Request, Response, NextFunction } from 'express';
import WorkspaceMember, { MemberRole } from '../models/WorkspaceMember';

export const isWorkspaceMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const membership = await WorkspaceMember.findOne({
      where: { workspaceId, userId },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    // Attach membership info to request
    (req as any).workspaceMember = membership;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const isWorkspaceAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const membership = await WorkspaceMember.findOne({
      where: { workspaceId, userId, role: MemberRole.ADMIN },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};