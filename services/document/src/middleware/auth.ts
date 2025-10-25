import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';

export interface AuthUser {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Verify token with auth service
    const response = await axios.get(`${config.authServiceUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    req.user = response.data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};