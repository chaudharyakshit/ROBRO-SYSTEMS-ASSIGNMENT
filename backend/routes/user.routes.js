'use strict';

const express  = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { verifyToken } = require('../middleware/auth.middleware');
const { checkRole }   = require('../middleware/role.middleware');
const { ROLES }       = require('../constants/roles');
const asyncHandler    = require('../utils/asyncHandler');

const router = express.Router();

// All routes require valid JWT + Admin role
router.use(verifyToken, checkRole(ROLES.ADMIN));

// ── Helpers ──────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── Validation Rules ─────────────────────────────────────────────────────────
const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('A valid email address is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/\d/).withMessage('Password must contain at least one number.'),
  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn([ROLES.SUPERVISOR, ROLES.WORKER]).withMessage(`Role must be '${ROLES.SUPERVISOR}' or '${ROLES.WORKER}'.`),
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

const validateUpdateRole = [
  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn([ROLES.SUPERVISOR, ROLES.WORKER]).withMessage(`Role must be '${ROLES.SUPERVISOR}' or '${ROLES.WORKER}'.`),
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
 * @route GET /api/users
 * @desc Retrieve list of all users
 * @access Private (Admin Only)
 */
router.get('/', asyncHandler(async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip   = (page - 1) * limit;

  const filter = {};
  const validRoles = Object.values(ROLES);

  if (req.query.role) {
    if (!validRoles.includes(req.query.role)) {
      const err = new Error('Invalid role filter value.');
      err.statusCode = 400;
      throw err;
    }
    filter.role = req.query.role;
  }

  if (req.query.search) {
    const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name:  { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return res.success({
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }, 'Users retrieved successfully.');
}));

/**
 * @route POST /api/users
 * @desc Create a new user profile
 * @access Private (Admin Only)
 */
router.post('/', validateCreateUser, asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    const err = new Error('An account with that email address already exists.');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password,
    role,
  });

  return res.success(user, 'User created successfully.', 201);
}));

/**
 * @route DELETE /api/users/:id
 * @desc Delete user profile
 * @access Private (Admin Only)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    const err = new Error('Invalid user ID.');
    err.statusCode = 400;
    throw err;
  }

  if (req.user._id.toString() === id) {
    const err = new Error('You cannot delete your own account.');
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return res.success(null, `User "${user.name}" has been deleted.`);
}));

/**
 * @route PATCH /api/users/:id/role
 * @desc Update a user role
 * @access Private (Admin Only)
 */
router.patch('/:id/role', validateUpdateRole, asyncHandler(async (req, res) => {
  const { id }   = req.params;
  const { role } = req.body;

  if (!isValidObjectId(id)) {
    const err = new Error('Invalid user ID.');
    err.statusCode = 400;
    throw err;
  }

  if (req.user._id.toString() === id) {
    const err = new Error('You cannot change your own role.');
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return res.success(user, `Role updated to "${role}" for user "${user.name}".`);
}));

module.exports = router;
