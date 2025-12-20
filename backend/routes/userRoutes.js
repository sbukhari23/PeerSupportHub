const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { registerValidation, loginValidation, validate } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', authLimiter, registerValidation, validate, async (req, res) => {
  const { name, email, password, username, userType } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ msg: 'Please provide a password' });
    }

    let user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ msg: 'User with this email or username already exists' });
    }

    user = new User({
      name,
      email,
      password,
      username,
      userType: userType || 'User',
      isEmailVerified: false, // Require email verification
    });

    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    // Respond with the user info (but don't provide token until verified)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      message: 'Registration successful! Please check your email to verify your account.',
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', authLimiter, loginValidation, validate, async (req, res) => {
  cons// Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
          requiresVerification: true,
          userId: user._id
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified
    // 2. Check if password matches (using the method we added to User.js)
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        token: generateToken(user._id),
// @route   GET /api/users/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    // Hash the token from URL to match with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.json({
      msg: 'Email verified successfully! You can now log in.',
      token: generateToken(user._id), // Provide token so they can log in immediately
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, user.name, verificationToken);

    res.json({ msg: 'Verification email sent successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ msg: 'If that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ msg: 'If that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/users/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;

  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Hash the token from URL to match with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      msg: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

      });
    } else {
      res.status(401).json({ msg: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;