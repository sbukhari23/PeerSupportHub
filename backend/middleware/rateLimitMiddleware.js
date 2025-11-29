const rateLimit = require('express-rate-limit');

const passThrough = (req, _res, next) => next();
const shouldBypass = () => process.env.RATE_LIMIT_DISABLED === 'true';

const buildLimiter = (options) => {
  const limiter = rateLimit(options);
  return (req, res, next) => (shouldBypass() ? passThrough(req, res, next) : limiter(req, res, next));
};

// General API rate limiter
const apiLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication routes
const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for creating resources
const createLimiter = buildLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 creates per minute
  message: 'Too many items created, please slow down.',
});

// Rate limiter for messages (prevent spam)
const messageLimiter = buildLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 messages per minute
  message: 'Sending messages too fast, please slow down.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  createLimiter,
  messageLimiter,
};
