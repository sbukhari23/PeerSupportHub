/**
 * Authentication Middleware
 * Week 13: Authentication and Security
 * Following MIT 6.102 principles: Defensive Programming, Error Handling
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to verify JWT tokens
 * @requires Authorization header with Bearer token
 * @effects Sets req.userId and req.user if authentication succeeds
 * @throws 401 if no token provided or token is invalid
 * @throws 403 if user is not active
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Check if header follows "Bearer <token>" format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Extract the actual token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Token not found.',
        code: 'TOKEN_NOT_FOUND'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');

    // Check token type (should be 'access' token)
    if (decoded.type !== 'access') {
      return res.status(401).json({
        error: 'Access denied. Invalid token type.',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Access denied. Account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user info to request object
    req.userId = decoded.userId;
    req.user = user;

    // Continue to next middleware
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied. Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Access denied. Token not active yet.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Generic server error
    res.status(500).json({
      error: 'Internal server error during authentication.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is provided
 * Useful for endpoints that work for both authenticated and non-authenticated users
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // If no auth header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
      
      if (decoded.type === 'access') {
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.userId = decoded.userId;
          req.user = user;
        }
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
      console.warn('Optional auth token error:', tokenError.message);
    }

    next();

  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Continue without authentication on error
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - Roles that are allowed to access the endpoint
 * @returns Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or '),
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for authenticated users
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns Express middleware function
 */
const createUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.userId) {
      return next(); // Skip rate limiting for non-authenticated users
    }

    const userId = req.userId.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let userHistory = userRequests.get(userId) || [];
    
    // Remove old requests outside the window
    userHistory = userHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded the limit
    if (userHistory.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userHistory[0] + windowMs - now) / 1000)
      });
    }

    // Add current request timestamp
    userHistory.push(now);
    userRequests.set(userId, userHistory);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [id, timestamps] of userRequests.entries()) {
        const filteredTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        if (filteredTimestamps.length === 0) {
          userRequests.delete(id);
        } else {
          userRequests.set(id, filteredTimestamps);
        }
      }
    }

    next();
  };
};

/**
 * Middleware to validate user owns a resource
 * @param {string} resourceUserField - Field name that contains the user ID in the resource
 * @returns Express middleware function
 */
const requireResourceOwnership = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    // This middleware should be used after a middleware that fetches the resource
    // and attaches it to req.resource
    
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.resource) {
      return res.status(500).json({
        error: 'Resource not found in request context.',
        code: 'RESOURCE_NOT_FOUND'
      });
    }

    const resourceUserId = req.resource[resourceUserField];
    
    if (!resourceUserId) {
      return res.status(500).json({
        error: 'Resource does not have user ownership information.',
        code: 'NO_OWNERSHIP_INFO'
      });
    }

    // Check if user owns the resource or has admin role
    if (resourceUserId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. You do not have permission to access this resource.',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  createUserRateLimit,
  requireResourceOwnership
};