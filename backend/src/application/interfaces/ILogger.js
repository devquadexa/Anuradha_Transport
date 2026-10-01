class ILogger {
  info(_message, _meta) {
    throw new Error('ILogger.info not implemented');
  }

  warn(_message, _meta) {
    throw new Error('ILogger.warn not implemented');
  }

  error(_message, _meta) {
    throw new Error('ILogger.error not implemented');
  }
}

module.exports = ILogger;
