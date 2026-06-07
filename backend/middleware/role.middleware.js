'use strict';

/**
 * checkRole
 * Factory function that returns an Express middleware enforcing role-based access.
 *
 * Usage:
 *   router.get('/admin-only', verifyToken, checkRole('Admin'), handler);
 *   router.get('/multi-role', verifyToken, checkRole('Admin', 'Supervisor'), handler);
 *
 * Must be used AFTER verifyToken so req.user is already populated.
 *
 * @param  {...string} roles  One or more allowed roles.
 * @returns {Function}        Express middleware function.
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Shouldn't happen if route is wired correctly (verifyToken runs first),
      // but acts as a safety net.
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { checkRole };
