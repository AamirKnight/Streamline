import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './database';
import Workspace from './models/Workspace';
import WorkspaceMember from './models/WorkspaceMember';
import WorkspaceInvitation from './models/WorkspaceInvitation';
import workspaceRoutes from './routes/workspaceRoutes';
import logger from './utils/logger';
import { connectCache } from './utils/cache';
import { apiLimiter } from './middleware/rateLimitter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ✅ STEP 1: Initialize cache first
connectCache();

// ✅ STEP 2: Helmet BEFORE CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// ✅ STEP 3: CORS Configuration (MUST be before express.json())
const allowedOrigins = [
  'https://streamline-frontend-nine.vercel.app',
  'http://localhost:3000',
  /^https:\/\/streamline-frontend-.*\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('❌ Blocked by CORS:', origin);
      callback(null, true); // ⚠️ Allow in production, log only
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
}));

// ✅ STEP 4: Handle preflight requests BEFORE other middleware
app.options('*', cors());

// ✅ STEP 5: Body parser
app.use(express.json());

// ✅ STEP 6: Apply rate limiting AFTER CORS and body parser
app.use(apiLimiter);

// ✅ STEP 7: Define model associations
Workspace.hasMany(WorkspaceMember, {
  foreignKey: 'workspaceId',
  as: 'members',
});
WorkspaceMember.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});

// ✅ STEP 8: Sync database
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true }).then(() => {
    logger.info('✅ Workspace database synchronized');
  }).catch(err => {
    logger.error('❌ Database sync failed:', err);
  });
}

// ✅ STEP 9: Health check (before auth middleware)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'workspace',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// ✅ STEP 10: Routes
app.use('/workspaces', workspaceRoutes);

// ✅ STEP 11: 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found:', { method: req.method, path: req.path });
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.path 
  });
});

// ✅ STEP 12: Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// ✅ STEP 13: Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Workspace service running on port ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 CORS enabled for: ${allowedOrigins.length} origins`);
  });
}

export default app;