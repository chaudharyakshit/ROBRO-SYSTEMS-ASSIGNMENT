'use strict';

const mongoose = require('mongoose');

/**
 * Image schema
 * Tracks every file uploaded through the /api/images/upload endpoint.
 * Stores only the filename, not the full path.
 */
const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Image must be associated with a user.'],
      index: true,
    },

    filename: {
      type: String,
      required: [true, 'Filename is required.'],
      trim: true,
      unique: true,
    },

    mimetype: {
      type: String,
      trim: true,
    },

    size: {
      type: Number,
      min: 0,
    },

    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for optimizing paginated fetches ordered by capturedAt
imageSchema.index({ userId: 1, capturedAt: -1 });

// Virtual property for filepath to keep compatibility with existing frontend
imageSchema.virtual('filepath').get(function () {
  return `uploads/${this.filename}`;
});

// Configure schema to include virtuals when transforming documents
imageSchema.set('toJSON', { virtuals: true });
imageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Image', imageSchema);
