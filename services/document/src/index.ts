import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDatabase from './database';
import documentRoutes from './routes/documentRoutes';
import logger from './utils/logger';
import { config } from './config';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for documents

// Connect to MongoDB
connectDatabase();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'document' });
});

app.use('/documents', documentRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    logger.info(`Document service running on port ${config.port}`);
  });
}

export default app;