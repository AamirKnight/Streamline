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
// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || config.port;

  app.listen(PORT, () => {
    logger.info(`Auth service running on port ${PORT}`);
  });
}


export default app;




