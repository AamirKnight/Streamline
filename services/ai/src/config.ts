import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Use DATABASE_URL directly (Railway injects it automatically)
  postgres: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/streamline_vectors',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    rateLimit: 60,
  },

  huggingface: {
    apiKey: process.env.HF_TOKEN || '',
    model: 'BAAI/bge-small-en-v1.5',
    embeddingDimension: 384,
    apiUrl: 'https://router.huggingface.co/hf-inference/models',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 2000,
  },

  documentServiceUrl:
    process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3003',
  authServiceUrl:
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  frontendUrl:
    process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Optional warning
if (!config.huggingface.apiKey) {
  console.warn('⚠️ Warning: HF_TOKEN is not set in .env file');
}

export default config;
