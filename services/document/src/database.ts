import mongoose from 'mongoose';
import { config } from './config';

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.mongodb.url, {
      serverSelectionTimeoutMS: 30000, // wait up to 30s to find a node
      socketTimeoutMS: 45000,          // keep sockets open longer for Atlas
      maxPoolSize: 10,                 // connection pool
      retryWrites: true,
      w: 'majority',
      appName: 'streamline-document-service',
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connection event listeners (optional but helpful in production logs)
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('🚨 MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

export default connectDatabase;
