'use strict';

const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// ── Validation Rules ─────────────────────────────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('A valid email address is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error('Validation failed');
      err.statusCode = 400;
      err.validationErrors = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }));
      return next(err);
    }
    next();
  }
];

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user (password field excluded by default, so re-select it)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated. Please contact an administrator.');
    err.statusCode = 403;
    throw err;
  }

  // Password comparison
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  // Sign JWT - strictly 8 hours expiry
  const payload = {
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  return res.success({
    token,
    user: {
      id:       user._id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      isActive: user.isActive,
    },
  }, 'Login successful.');
}));

module.exports = router;
