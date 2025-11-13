import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sequelize from './database';
import EmailVerification from './models/EmailVerification';
import PasswordReset from './models/PasswordReset';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';
import logger from './utils/logger';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'https://streamline-frontend-hdryvwclb-videos-projects-8b956c87.vercel.app/', // Your actual frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Sync database only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true }).then(() => {
    logger.info('Database synchronized');
  });
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth' });
});

app.use('/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    logger.info(`Auth service running on port ${config.port}`);
  });
}

export default app;




