import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sequelize from './database';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Sync database
sequelize.sync({ alter: false }).then(() => {
  console.log('✅ Database synchronized');
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth' });
});

app.use('/auth', authRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Auth service running on port ${config.port}`);
});

export default app;