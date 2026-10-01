const { Sequelize } = require('sequelize');
const env = require('../../config/env');
const logger = require('../../logging/WinstonLogger');

/**
 * Sequelize connection instance. This backend project only ever READS the
 * schema created by the independent `database` project's migrations - it
 * never calls sync() or alters tables.
 */
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.nodeEnv === 'development' ? (msg) => logger.info(msg) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function testConnection() {
  await sequelize.authenticate();
  logger.info('Database connection established successfully');
}

module.exports = { sequelize, testConnection };
