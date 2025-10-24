import { Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES } from '../constants';

export type UserRole = 'admin' | 'editor' | 'viewer';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: ERROR_MESSAGES.UNAUTHORIZED });
    }

    // For now, we'll add role checking later when we have roles in the database
    // This is a placeholder that always allows through
    // TODO: Check user role from database
    
    next();
  };
};

// Specific role checkers
export const isAdmin = requireRole(['admin']);
export const isEditor = requireRole(['admin', 'editor']);
export const isViewer = requireRole(['admin', 'editor', 'viewer']);