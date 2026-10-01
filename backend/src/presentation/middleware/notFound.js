const ApiResponse = require('../../application/common/ApiResponse');

function notFound(req, res) {
  return ApiResponse.error(res, {
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND',
    statusCode: 404,
  });
}

module.exports = notFound;
