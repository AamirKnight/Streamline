import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017/streamline',
    },
  },
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  workspaceServiceUrl: process.env.WORKSPACE_SERVICE_URL || 'http://localhost:3002',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};