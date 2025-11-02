import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'streamline_vectors',
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-pro',
    rateLimit: 60, // per minute
  },
  huggingface: {
    apiKey: process.env.HF_TOKEN || '',
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    embeddingDimension: 384,
  },
  documentServiceUrl: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};