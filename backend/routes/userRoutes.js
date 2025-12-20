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
      isEmailVerified: true, // TODO: Set to false when email is configured
    });

    // TODO: Uncomment when email service is configured
    // const verificationToken = user.generateEmailVerificationToken();
    
    await user.save();

    // TODO: Uncomment when email service is configured
    // await sendVerificationEmail(email, name, verificationToken);

    // Respond with the user info and token (email verification temporarily disabled)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
      message: 'Registration successful!',
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
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. Check if password matches (using the method we added to User.js)
    if (user && (await user.matchPassword(password))) {
      // TODO: Uncomment when email service is configured
      // if (!user.isEmailVerified) {
      //   return res.status(403).json({ 
      //     msg: 'Please verify your email before logging in. Check your inbox for the verification link.',
      //     requiresVerification: true,
      //     userId: user._id
      //   });
      // }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ msg: 'Invalid email or password' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

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

    // TODO: Uncomment when email service is configured
    // await sendWelcomeEmail(user.email, user.name);

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

    // TODO: Uncomment when email service is configured
    // const verificationToken = user.generateEmailVerificationToken();
    // await user.save();
    // await sendVerificationEmail(email, user.name, verificationToken);

    res.json({ msg: 'Verification email would be sent (email service not configured)' });
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
      return res.json({ msg: 'Password reset email would be sent (email service not configured)' });
    }

    // TODO: Uncomment when email service is configured
    // const resetToken = user.generatePasswordResetToken();
    // await user.save();
    // await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ msg: 'Password reset email would be sent (email service not configured)' });
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

module.exports = router;
