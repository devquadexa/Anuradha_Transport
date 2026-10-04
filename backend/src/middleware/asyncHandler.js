/**
 * Wraps async controller functions so rejected promises are forwarded to
 * the centralized error handler instead of requiring try/catch everywhere.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
