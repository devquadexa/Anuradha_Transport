const winston = require('winston');
const path = require('path');
const ILogger = require('../../application/interfaces/ILogger');
const env = require('../config/env');

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts}] ${level}: ${message}${metaStr}`;
  })
);

const winstonInstance = winston.createLogger({
  level: env.logging.level,
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', '..', 'logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '..', '..', '..', 'logs', 'combined.log'),
    }),
  ],
});

/**
 * Concrete ILogger implementation backed by Winston. Use cases depend on
 * ILogger, never on this class directly.
 */
class WinstonLogger extends ILogger {
  info(message, meta = {}) {
    winstonInstance.info(message, meta);
  }

  warn(message, meta = {}) {
    winstonInstance.warn(message, meta);
  }

  error(message, meta = {}) {
    winstonInstance.error(message, meta);
  }
}

module.exports = new WinstonLogger();
