import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';

interface JoinDocumentData {
  documentId: string;
}

interface CursorPosition {
  documentId: string;
  position: number;
  selection?: { start: number; end: number };
}

interface TypingStatus {
  documentId: string;
  isTyping: boolean;
}

export const setupDocumentHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;
  const username = (socket as any).username;

  // Join a document room
  socket.on('document:join', async (data: JoinDocumentData) => {
    const { documentId } = data;

    try {
      // Join the document room
      await socket.join(`document:${documentId}`);

      logger.info('User joined document', { userId, documentId, socketId: socket.id });

      // Get all users in this document room
      const socketsInRoom = await io.in(`document:${documentId}`).fetchSockets();
      const usersInDocument = socketsInRoom.map((s) => ({
        socketId: s.id,
        userId: (s as any).userId,
        username: (s as any).username,
      }));

      // Notify user of all active users
      socket.emit('document:users', usersInDocument);

      // Notify others that a new user joined
      socket.to(`document:${documentId}`).emit('document:user-joined', {
        socketId: socket.id,
        userId,
        username,
      });
    } catch (error) {
      logger.error('Error joining document:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  // Leave a document room
  socket.on('document:leave', (data: JoinDocumentData) => {
    const { documentId } = data;

    socket.leave(`document:${documentId}`);
    
    logger.info('User left document', { userId, documentId });

    // Notify others
    socket.to(`document:${documentId}`).emit('document:user-left', {
      socketId: socket.id,
      userId,
      username,
    });
  });

  // Cursor position updates
  socket.on('cursor:update', (data: CursorPosition) => {
    const { documentId, position, selection } = data;

    // Broadcast to others in the same document
    socket.to(`document:${documentId}`).emit('cursor:update', {
      socketId: socket.id,
      userId,
      username,
      position,
      selection,
    });
  });

  // Typing indicator
  socket.on('typing:status', (data: TypingStatus) => {
    const { documentId, isTyping } = data;

    socket.to(`document:${documentId}`).emit('typing:status', {
      socketId: socket.id,
      userId,
      username,
      isTyping,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Socket.io automatically removes from all rooms
    logger.info('Socket disconnected', { socketId: socket.id, userId });
  });
};