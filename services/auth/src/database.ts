import { Sequelize } from 'sequelize';
import { config } from './config';

const sequelize = new Sequelize(
  config.database.mysql.database,
  config.database.mysql.username,
  config.database.mysql.password,
  {
    host: config.database.mysql.host,
    port: config.database.mysql.port,
    dialect: 'mysql',
    logging: config.nodeEnv === 'development' ? console.log : false,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL database connected');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
    process.exit(1);
  });

export default sequelize;