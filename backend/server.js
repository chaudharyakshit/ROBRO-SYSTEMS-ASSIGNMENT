'use strict';

require('dotenv').config();

const express       = require('express');
const mongoose      = require('mongoose');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss           = require('xss-clean');
const morgan        = require('morgan');

const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const imageRoutes        = require('./routes/image.routes');
const notificationRoutes = require('./routes/notification.routes');
const responseMiddleware = require('./middleware/response.middleware');
const errorMiddleware    = require('./middleware/error.middleware');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Morgan Logger ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://31.97.235.234',        // Production server
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    errors: [],
  },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 10 minutes before trying again.',
    errors: [],
  },
});

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Security Protections against Mongo Injection and XSS ───────────────────
app.use(mongoSanitize());
app.use(xss());

// ─── Standard Response Formatting Helpers Middleware ────────────────────────
app.use(responseMiddleware);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  return res.success({
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }, 'Robro Assignment API is up and running.');
});

// ─── Route Mounting ──────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/images',        imageRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  return res.error(`Route ${req.method} ${req.originalUrl} not found.`, 404);
});

// ─── Global Centralized Error Handler Middleware ────────────────────────────
app.use(errorMiddleware);

// ─── MongoDB Connection & Server Start ───────────────────────────────────────
const MAX_DB_RETRIES  = 10;
const BASE_RETRY_MS   = 3000;  // start at 3 s
const MAX_RETRY_MS    = 30000; // cap at 30 s

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[DB] MongoDB connected → ${conn.connection.host}`);
  } catch (error) {
    const isWhitelistErr = error.message?.includes('whitelist') || error.message?.includes('IP');
    const hint = isWhitelistErr
      ? ' — TIP: Add your current IP to MongoDB Atlas Network Access.'
      : '';

    if (attempt >= MAX_DB_RETRIES) {
      console.error(`[DB] Could not connect after ${MAX_DB_RETRIES} attempts. Shutting down.${hint}`);
      process.exit(1);
    }

    const delay = Math.min(BASE_RETRY_MS * attempt, MAX_RETRY_MS);
    console.warn(`[DB] Connection failed (attempt ${attempt}/${MAX_DB_RETRIES}): ${error.message}${hint}`);
    console.warn(`[DB] Retrying in ${delay / 1000}s…`);
    await new Promise((res) => setTimeout(res, delay));
    return connectDB(attempt + 1);
  }
};

// Start HTTP server only after DB is ready
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] http://localhost:${PORT} — NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
});

// Graceful shutdown on SIGTERM (e.g. from PM2 or Docker)
process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM received — closing connections gracefully.');
  await mongoose.connection.close();
  process.exit(0);
});

// ─── Mongoose Runtime Reconnection Guards ────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('[DB] MongoDB disconnected. Mongoose will auto-reconnect…');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DB] MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Runtime connection error:', err.message);
});
