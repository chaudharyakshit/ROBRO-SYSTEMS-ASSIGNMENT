'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const Image   = require('../models/Image');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth.middleware');
const { cacheResponse, clearCache } = require('../middleware/cache.middleware');
const { ROLES } = require('../constants/roles');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// ── Multer Configuration ──────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE_MB   = 5;

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(_req, file, cb) {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const ext       = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomHex}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG and PNG images are allowed.'),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

/**
 * @route GET /api/images/file/:filename
 * @desc Protected static image file stream
 * @access Private (Owner or Admin Only)
 */
router.get('/file/:filename', verifyToken, asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    const err = new Error('File not found.');
    err.statusCode = 404;
    throw err;
  }

  const image = await Image.findOne({ filename });
  if (!image) {
    if (req.user.role === ROLES.ADMIN) {
      return res.sendFile(filePath);
    }
    const err = new Error('Image record not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = image.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === ROLES.ADMIN;

  if (!isOwner && !isAdmin) {
    const err = new Error('Access denied. You do not have permission to access this file.');
    err.statusCode = 403;
    throw err;
  }

  return res.sendFile(filePath);
}));

/**
 * @route POST /api/images/upload
 * @desc Upload captured photo
 * @access Private (Authenticated)
 */
router.post(
  '/upload',
  verifyToken,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      const err = new Error('No file uploaded. Send the image under the "image" field.');
      err.statusCode = 400;
      throw err;
    }

    const { originalname, filename, mimetype, size } = req.file;
    const filepath = `uploads/${filename}`;

    const imageDoc = await Image.create({
      userId:     req.user._id,
      filename,
      filepath,
      mimetype,
      size,
      capturedAt: new Date(),
    });

    // Create notification for admin if user is supervisor or worker
    if (req.user.role !== ROLES.ADMIN) {
      await Notification.create({
        userId: req.user._id,
        message: `${req.user.name} (${req.user.role}) captured a new photo.`,
        imagePath: filepath,
      });
    }

    // Invalidate caches
    await clearCache('/api/images');
    await clearCache('/api/notifications');

    return res.success(imageDoc, 'Image uploaded successfully.', 201);
  })
);

/**
 * @route GET /api/images
 * @desc Retrieve list of images
 * @access Private (Authenticated)
 */
router.get('/', verifyToken, cacheResponse(60), asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip  = (page - 1) * limit;

  // Build aggregation pipeline instead of Mongoose find().populate() for speed
  const pipeline = [];

  if (req.user.role !== ROLES.ADMIN) {
    pipeline.push({ $match: { userId: req.user._id } });
  }

  pipeline.push({ $sort: { capturedAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  if (req.user.role === ROLES.ADMIN) {
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId'
      }
    });
    pipeline.push({
      $unwind: { path: '$userId', preserveNullAndEmptyArrays: true }
    });
    pipeline.push({
      $project: {
        'userId.password': 0,
        'userId.createdAt': 0,
        'userId.updatedAt': 0,
        'userId.__v': 0
      }
    });
  }

  const [images, total] = await Promise.all([
    Image.aggregate(pipeline),
    Image.countDocuments(req.user.role === ROLES.ADMIN ? {} : { userId: req.user._id }),
  ]);

  return res.success({
    images,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }, 'Images retrieved successfully.');
}));

/**
 * @route DELETE /api/images/:id
 * @desc Delete image entry
 * @access Private (Owner or Admin Only)
 */
router.delete('/:id', verifyToken, asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);

  if (!image) {
    const err = new Error('Image not found.');
    err.statusCode = 404;
    throw err;
  }

  if (req.user.role !== ROLES.ADMIN && image.userId.toString() !== req.user._id.toString()) {
    const err = new Error('You do not have permission to delete this image.');
    err.statusCode = 403;
    throw err;
  }

  const absolutePath = path.join(UPLOAD_DIR, image.filename);
  fs.unlink(absolutePath, (unlinkErr) => {
    if (unlinkErr && unlinkErr.code !== 'ENOENT' && process.env.NODE_ENV === 'development') {
      console.warn('[Disk Error] Unlink failure:', unlinkErr.message);
    }
  });

  await image.deleteOne();
  await clearCache('/api/images');

  return res.success(null, 'Image deleted successfully.');
}));

module.exports = router;
