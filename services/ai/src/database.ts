import { Sequelize } from 'sequelize';
import { config } from './config';

const sequelize = new Sequelize(
  config.postgres.database,
  config.postgres.username,
  config.postgres.password,
  {
    host: config.postgres.host,
    port: config.postgres.port,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
  }
);

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