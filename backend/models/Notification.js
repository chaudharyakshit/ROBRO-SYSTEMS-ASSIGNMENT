'use strict';

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // auto adds createdAt + updatedAt fields
  }
);

// Compound index for optimizing unread and latest notifications
notificationSchema.index({ userId: 1, createdAt: -1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
