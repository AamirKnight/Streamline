import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './database';
import { setupVectorExtension } from './models/DocumentEmbedding';
import aiRoutes from './routes/aiRoutes';

import logger from './utils/logger';
import { connectCache } from './utils/cache';
import { config } from './config';

dotenv.config();

const app = express();

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
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ai',
    features: [
      'semantic-search',
      'document-insights',
      'writing-assistant',
      'conflict-resolution',
    ],
  });
});

app.use('/ai', aiRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(err.statusCode || 500).json({
    error:
      config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

const init = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected');

    await setupVectorExtension();

    await connectCache();

    // await indexWorker.connect();

    app.listen(config.port, () => {
      logger.info(`🚀 AI service running on port ${config.port}`);
      logger.info(`📊 Using: Gemini Pro + HuggingFace + pgvector`);
    });
  } catch (error) {
    logger.error('❌ Initialization failed:', error);
    process.exit(1);
  }
};

if (config.nodeEnv !== 'test') {
  init();
}

export default app;