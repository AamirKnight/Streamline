import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisClients } from '../utils/redis';
import logger from '../utils/logger';
import { verifySocketToken } from './middleware';
import { setupDocumentHandlers } from './documentHandler'

export const setupSocketIO = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Setup Redis adapter for multi-server support
  const { pubClient, subClient } = createRedisClients();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Socket.io Redis adapter connected');
    })
    .catch((err) => {
      logger.error('❌ Redis adapter connection error:', err);
    });

  // Authentication middleware
  io.use(verifySocketToken);

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const username = (socket as any).username;

    logger.info('User connected via Socket.io', { 
      socketId: socket.id, 
      userId, 
      username 
    });

    // Setup document-specific handlers
    setupDocumentHandlers(io, socket);

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected', { 
        socketId: socket.id, 
        userId, 
        reason 
      });
    });
  });

  return io;
};