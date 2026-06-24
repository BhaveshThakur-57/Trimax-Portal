const rateLimit = require('express-rate-limit');

// ── Public API limiter (20 req/min/IP) ──
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  }
});

// ── Auth limiter — login / register / forgot-password (5 req/min/IP) ──
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.',
  }
});

// ── Authenticated API limiter (60 req/min per user) ──
const authenticatedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down.',
  }
});

module.exports = {
  publicLimiter,
  authLimiter,
  authenticatedLimiter,
};
