import dotenv from 'dotenv';

// Load environment variables from .env file
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
    rateLimit: 60,
  },
 // Update your config.ts
huggingface: {
  apiKey: process.env.HF_TOKEN || '',
  model: 'Xenova/all-MiniLM-L6-v2',
  embeddingDimension: 384,
  // CORRECT: Use /models/ endpoint instead of /pipeline/
  apiUrl: 'https://api-inference.huggingface.co/models',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 2000,
},
  documentServiceUrl: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Optional: Add validation for critical env vars
if (!config.huggingface.apiKey) {
  console.warn('⚠️  Warning: HF_TOKEN is not set in .env file');
}

if (!config.gemini.apiKey) {
  console.warn('⚠️  Warning: GEMINI_API_KEY is not set in .env file');
}

export default config;
