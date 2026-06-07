'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { ROLES } = require('../constants/roles');

const SALT_ROUNDS = 12;

/**
 * User schema
 * Stores account credentials, role assignment and status flag.
 * Passwords are never stored as plain text — bcrypt hashing is done
 * inside a pre-save hook so every code path (create & update) benefits.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },

    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },

    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      select: false, // never returned in queries unless explicitly requested
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: `Role must be one of: ${Object.values(ROLES).join(', ')}.`,
      },
      default: ROLES.WORKER,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
// Only re-hash if the password field was actually modified to avoid
// double-hashing on unrelated document saves.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt    = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Method ──────────────────────────────────────────────────────────
// Useful in the auth controller for clean password comparison.
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Transform Output ─────────────────────────────────────────────────────────
// Strip the password field from any JSON response automatically.
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
