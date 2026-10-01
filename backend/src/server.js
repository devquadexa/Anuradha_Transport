const app = require('./app');
const env = require('./infrastructure/config/env');
const logger = require('./infrastructure/logging/WinstonLogger');
const { testConnection } = require('./infrastructure/database/sequelize/connection');

async function start() {
  try {
    await testConnection();

    const server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
      logger.info(`Swagger docs available at http://localhost:${env.port}/api-docs`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

start();
