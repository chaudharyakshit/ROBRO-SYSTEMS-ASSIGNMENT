'use strict';

/**
 * responseMiddleware
 * Extends Express response object with unified success and error response structures.
 */
const responseMiddleware = (req, res, next) => {
  res.success = (data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };

  res.error = (message = 'Error', statusCode = 400, errors = []) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  };

  next();
};

module.exports = responseMiddleware;
