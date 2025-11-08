import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';
import hpp from 'hpp';

import connectDatabase from './database';
import { connectRedis } from './utils/redis';
import { setupSocketIO } from './socket';
import documentRoutes from './routes/documentRoutes';
import cacheRoutes from './routes/cacheRoutes';
import { apiLimiter } from './middleware/rateLimitter';
import logger from './utils/logger';
import { config } from './config';
import aiPublisher from './utils/aiPublisher';
import workflowRoutes from './routes/workflowRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ---------------------------
// ⚙️ 1. Core Middleware
// ---------------------------

app.use(express.json({ limit: '10mb' }));
aiPublisher.connect();
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ---------------------------
// 🛡️ 2. Security Middleware
// ---------------------------

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(apiLimiter);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ---------------------------
// 🧭 3. Routes
// ---------------------------

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'document', socketio: 'enabled' });
});

app.use('/documents', documentRoutes);
app.use('/workflows', workflowRoutes); 
app.use('/cache', cacheRoutes);

// ---------------------------
// 🧩 4. Error Handling
// ---------------------------

// Mongoose, JWT, and generic errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map((e: any) => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  res.status(err.statusCode || 500).json({
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ---------------------------
// 💾 5. Database & Redis Connections
// ---------------------------

connectDatabase();
connectRedis();

// ---------------------------
// ⚡ 6. Socket.io Setup
// ---------------------------

const io = setupSocketIO(httpServer);
app.set('io', io);

// ---------------------------
// 🚀 7. Start Server
// ---------------------------

if (config.nodeEnv !== 'test') {
  httpServer.listen(config.port, () => {
    logger.info(`Document service with Socket.io running on port ${config.port}`);
  });
}

export default app;
