import { Sequelize } from 'sequelize';
import { config } from './config';

// Initialize Sequelize with connection string instead of individual credentials
const sequelize = new Sequelize(config.postgres.connectionString, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,              // Neon requires SSL
      rejectUnauthorized: false,  // accept self-signed certs
    },
  },
});

// Verify connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ PostgreSQL database connected');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to PostgreSQL:', err);
    process.exit(1);
  });

export default sequelize;
