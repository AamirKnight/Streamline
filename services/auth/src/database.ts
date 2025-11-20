import { Sequelize } from 'sequelize';
import { config } from './config';

const sequelize = new Sequelize(config.postgres.connectionString, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false, // For services like Railway/Heroku
    } : false,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL database connected');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
    process.exit(1);
  });

export default sequelize;