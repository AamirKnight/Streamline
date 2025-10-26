import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDatabase from './database';
import { connectRedis } from './utils/redis';
import documentRoutes from './routes/documentRoutes';
import { setupSocketIO } from './socket';
import logger from './utils/logger';
import { config } from './config';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB and Redis
connectDatabase();
connectRedis();

// Setup Socket.io
const io = setupSocketIO(httpServer);

// Make io available to routes
app.set('io', io);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'document', socketio: 'enabled' });
});

app.use('/documents', documentRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (config.nodeEnv !== 'test') {
  httpServer.listen(config.port, () => {
    logger.info(`Document service with Socket.io running on port ${config.port}`);
  });
}

export default app;