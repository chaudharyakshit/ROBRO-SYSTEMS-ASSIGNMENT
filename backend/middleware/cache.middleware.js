const redis = require('redis');

// Initialize Redis Client
// In a real environment, you'd use process.env.REDIS_URL
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff, capping retry delay at 10 seconds
      return Math.min(retries * 1000, 10000);
    }
  }
});

let redisErrorLogged = false;

client.on('error', (err) => {
  if (!redisErrorLogged) {
    // AggregateError wraps individual connection errors — extract the real code
    const reason = err?.errors?.[0]?.code || err?.code || err?.message || 'UNKNOWN';
    console.warn(`[Redis] Unavailable (${reason}). Caching is disabled — app will run normally without it.`);
    redisErrorLogged = true;
  }
});

client.on('connect', () => {
  console.log('[Redis] Connected successfully.');
  redisErrorLogged = false;
});

// Connect to Redis immediately (non-blocking)
client.connect().catch(() => {
  // Silent catch because the 'error' event listener handles logging connection failure gracefully
});

/**
 * Middleware to cache responses for GET requests
 * @param {number} ttl Time to live in seconds
 */
const cacheResponse = (ttl = 60) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      if (!client.isReady) {
        return next();
      }

      // Generate a unique cache key based on the URL and user role
      // For images/notifications, admin sees different things than regular user
      const cacheKey = `cache:${req.user?._id || 'public'}:${req.originalUrl}`;

      const cachedData = await client.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Override res.json to capture the response body and cache it
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.setEx(cacheKey, ttl, JSON.stringify(body)).catch(err => {
            console.error('Redis cache set error:', err);
          });
        }
        originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Redis cache middleware error:', err);
      next(); // Fail open if Redis throws an error
    }
  };
};

/**
 * Utility to clear cache for a specific pattern (e.g. invalidate caches on write)
 * @param {string} pattern
 */
const clearCache = async (pattern) => {
  try {
    if (client.isReady) {
      const keys = await client.keys(`cache:*${pattern}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
  } catch (err) {
    console.error('Redis clear cache error:', err);
  }
};

module.exports = {
  cacheResponse,
  clearCache,
  redisClient: client
};
