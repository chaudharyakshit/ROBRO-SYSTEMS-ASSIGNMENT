'use strict';

const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { cacheResponse, clearCache } = require('../middleware/cache.middleware');
const { ROLES } = require('../constants/roles');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Require authorization and Admin role for all notification routes
router.use(verifyToken, checkRole(ROLES.ADMIN));

/**
 * @route GET /api/notifications
 * @desc Retrieve list of notifications
 * @access Private (Admin Only)
 */
router.get(
  '/',
  cacheResponse(60),
  asyncHandler(async (req, res) => {
    // Instead of find().populate(), use aggregation for performance
    const notifications = await Notification.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      { $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          'userId.password': 0,
          'userId.createdAt': 0,
          'userId.updatedAt': 0,
          'userId.__v': 0
        }
      }
    ]);
    return res.success(notifications, 'Notifications retrieved successfully.');
  })
);

/**
 * @route PATCH /api/notifications/read
 * @desc Mark all notifications as read
 * @access Private (Admin Only)
 */
router.patch(
  '/read',
  asyncHandler(async (req, res) => {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    await clearCache('/api/notifications');
    return res.success(null, 'All notifications marked as read.');
  })
);

module.exports = router;
