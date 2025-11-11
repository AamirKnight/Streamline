import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    mysql: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'streamline',
    },
  },
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // 👇 ADD THIS SECTION
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m', // access token lifetime
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // refresh token lifetime
  },
};
