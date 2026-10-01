const { AppError } = require('../../domain/errors');
const ApiResponse = require('../../application/common/ApiResponse');
const logger = require('../../infrastructure/logging/WinstonLogger');
const env = require('../../infrastructure/config/env');

/**
 * Centralized error-handling middleware. Every error thrown anywhere in
 * the request lifecycle (use cases, repositories, controllers) ends up
 * here and is mapped to a standardized JSON response. Must be registered
 * last in the Express middleware chain.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    logger.warn(err.message, { errorCode: err.errorCode, path: req.originalUrl });
    return ApiResponse.error(res, {
      message: err.message,
      errorCode: err.errorCode,
      details: err.details,
      statusCode: err.statusCode,
    });
  }

  // Sequelize unique constraint violations, etc.
  if (err.name === 'SequelizeUniqueConstraintError') {
    return ApiResponse.error(res, {
      message: 'A record with this value already exists',
      errorCode: 'CONFLICT',
      details: err.errors ? err.errors.map((e) => e.message) : null,
      statusCode: 409,
    });
  }

  logger.error(err.message, { stack: err.stack, path: req.originalUrl });

  return ApiResponse.error(res, {
    message: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
    errorCode: 'INTERNAL_ERROR',
    details: env.nodeEnv === 'production' ? null : err.stack,
    statusCode: 500,
  });
}

module.exports = errorHandler;
