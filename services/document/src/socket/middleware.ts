import { Socket } from 'socket.io';
import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

export const verifySocketToken = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token with auth service
    const response = await axios.get(`${config.authServiceUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Attach user info to socket
    (socket as any).userId = response.data.user.id;
    (socket as any).username = response.data.user.username || response.data.user.email;

    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};