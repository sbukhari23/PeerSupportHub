/**
 * Authentication Routes
 * Week 11: Express.js Framework + Week 13: Authentication and Security
 * Following MIT 6.102 principles: Specifications, Error Handling
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints (stricter limits)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/register
 * Register a new user account
 * @body {email, password, username, fullName, dateOfBirth}
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, username, fullName, dateOfBirth } = req.body;

    // Input validation (MIT 6.102: Defensive Programming)
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are required'
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        error: 'Username must be between 3 and 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error: existingUser.email === email.toLowerCase() 
          ? 'Email is already registered' 
          : 'Username is already taken'
      });
    }

    // Hash password
    const saltRounds = 12; // High security for password hashing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      username: username.toLowerCase(),
      profile: {
        fullName: fullName || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
      }
    });

    await user.save();

    // Generate JWT tokens
    const { token, refreshToken } = generateTokens(user._id);

    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.status(201).json({
      message: 'Account created successfully',
      user: userData,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(e => e.message)
      });
    }

    res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * @body {email, password, rememberMe}
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password'); // Include password field

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokenExpiry = rememberMe ? '7d' : '24h';
    const { token, refreshToken } = generateTokens(user._id, tokenExpiry);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data (excluding password)
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.json({
      message: 'Login successful',
      user: userData,
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate tokens)
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just return success as the client will remove the token
    
    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error during logout'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * @body {refreshToken}
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret-key');
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const { token } = generateTokens(user._id);

    res.json({
      token,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Invalid or expired refresh token'
      });
    }

    res.status(500).json({
      error: 'Internal server error during token refresh'
    });
  }
});

/**
 * POST /api/auth/forgot-password
 * Initiate password reset process
 * @body {email}
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    // Only send email if user exists
    if (user && user.isActive) {
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        { userId: user._id, type: 'password-reset' },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '1h' }
      );

      // In a real app, you would send an email here
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      // You could also store the reset token in the database with expiration
      // user.passwordResetToken = resetToken;
      // user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      // await user.save();
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/verify-token
 * Verify if current token is valid
 */
router.get('/verify-token', authMiddleware, async (req, res) => {
  try {
    // If middleware passes, token is valid
    const user = await User.findById(req.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'User not found or inactive'
      });
    }

    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.json({
      valid: true,
      user: userData
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Helper function to generate JWT tokens
function generateTokens(userId, accessTokenExpiry = '24h') {
  const token = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'secret-key',
    { expiresIn: accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { expiresIn: '30d' }
  );

  return { token, refreshToken };
}

module.exports = router;