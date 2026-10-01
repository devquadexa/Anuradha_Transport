/**
 * Standardized API response envelope used by every controller.
 */
class ApiResponse {
  static success(res, { message = 'Success', data = null, meta = null, statusCode = 200 } = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
    });
  }

  static error(res, { message = 'Something went wrong', errorCode = 'INTERNAL_ERROR', details = null, statusCode = 500 } = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      details,
    });
  }
}

module.exports = ApiResponse;
