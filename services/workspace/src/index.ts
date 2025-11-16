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
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
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