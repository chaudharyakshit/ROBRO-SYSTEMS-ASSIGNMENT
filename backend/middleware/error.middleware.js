'use strict';

/**
 * errorMiddleware
 * Centralized error handler middleware. Mounted last in server.js.
 * Enforces response format: { success: false, message: "...", errors: [] }
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred. Please try again later.';
  let errors = [];

  // Log error stack only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('[Unhandled Error Stack]', err.stack || err);
  }

  // Multer file-size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large. Maximum allowed size is 5 MB.';
  }

  // Multer unexpected file (usually file filter rejection)
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 415;
    message = err.field || 'Only JPG and PNG images are allowed.';
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
    errors = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `A record with that ${field} already exists.`;
    errors = [{ field, message }];
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // JWT invalid signature / tampering error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  // express-validator list errors
  if (err.validationErrors) {
    statusCode = 400;
    message = err.message;
    errors = err.validationErrors;
  }

  if (typeof res.error === 'function') {
    return res.error(message, statusCode, errors);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = errorMiddleware;
