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

interface DocumentChange {
  documentId: string;
  content: string;
  version: number;
}

// Track active users per document
const activeUsers = new Map<string, Set<string>>();

export const setupDocumentHandlers = (io: Server, socket: Socket) => {
  const userId = (socket as any).userId;
  const username = (socket as any).username;

  // Join a document room
  socket.on('document:join', async (data: JoinDocumentData) => {
    const { documentId } = data;

    try {
      // Join the document room
      await socket.join(`document:${documentId}`);

      // Track user in document
      if (!activeUsers.has(documentId)) {
        activeUsers.set(documentId, new Set());
      }
      activeUsers.get(documentId)!.add(socket.id);

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

    // Remove from active users
    if (activeUsers.has(documentId)) {
      activeUsers.get(documentId)!.delete(socket.id);
      if (activeUsers.get(documentId)!.size === 0) {
        activeUsers.delete(documentId);
      }
    }
    
    logger.info('User left document', { userId, documentId });

    // Notify others
    socket.to(`document:${documentId}`).emit('document:user-left', {
      socketId: socket.id,
      userId,
      username,
    });
  });

  // Real-time document content changes
  socket.on('document:change', async (data: DocumentChange) => {
    const { documentId, content, version } = data;

    try {
      // Broadcast to all other users in the document
      socket.to(`document:${documentId}`).emit('document:change', {
        documentId,
        content,
        version,
        userId,
        username,
        timestamp: Date.now(),
      });

      logger.debug('Document change broadcast', { documentId, userId });
    } catch (error) {
      logger.error('Error broadcasting document change:', error);
    }
  });

  // Document saved (persisted to DB)
  socket.on('document:saved', (data: { documentId: string; version: number }) => {
    const { documentId, version } = data;

    socket.to(`document:${documentId}`).emit('document:saved', {
      documentId,
      version,
      savedBy: userId,
      timestamp: Date.now(),
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
    // Remove from all document rooms
    for (const [documentId, users] of activeUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        if (users.size === 0) {
          activeUsers.delete(documentId);
        }

        // Notify others in the document
        socket.to(`document:${documentId}`).emit('document:user-left', {
          socketId: socket.id,
          userId,
          username,
        });
      }
    }

    logger.info('Socket disconnected and cleaned up', { socketId: socket.id, userId });
  });
};