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

// After other connections

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
connectCache();
// Middleware

app.use(apiLimiter);
app.use(helmet());
const allowedOrigins = [
  'https://streamline-frontend-nine.vercel.app', // Production
  'http://localhost:3000', // Local development
  /^https:\/\/streamline-frontend-.*\.vercel\.app$/, // All Vercel preview deployments
];

// ✅ STEP 2: Dynamic CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list or matches regex pattern
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
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours - cache preflight requests
}));

// ✅ STEP 3: Handle preflight explicitly
app.options('*', cors());
app.use(express.json());

// Define model associations
Workspace.hasMany(WorkspaceMember, {
  foreignKey: 'workspaceId',
  as: 'members',
});
WorkspaceMember.belongsTo(Workspace, {
  foreignKey: 'workspaceId',
  as: 'workspace',
});

// Sync database
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true }).then(() => {
    logger.info('Workspace database synchronized');
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'workspace' });
});

app.use('/workspaces', workspaceRoutes);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Workspace service running on port ${PORT}`);
  });
}

export default app;