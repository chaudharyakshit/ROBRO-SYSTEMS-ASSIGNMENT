'use strict';

/**
 * asyncHandler
 * Wraps async Express route handlers to automatically catch any rejected promise
 * and pass the error to the next() middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
