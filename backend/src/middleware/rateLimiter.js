const rateLimit = require('express-rate-limit');

/**
 * Rate limiter — 60 requests per minute per IP.
 * When a userId is available (after auth middleware), the key
 * switches to the userId so limits are per-user, not per-IP.
 */
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  message: {
    error: true,
    message: 'Too many requests. Please slow down.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = { rateLimiter };
