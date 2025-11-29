const express = require('express');
const router = express.Router();
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { registerValidation, loginValidation, validate } = require('../middleware/validationMiddleware');

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
    });

    await user.save();

    // Respond with the user info AND the token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      userType: user.userType,
      token: generateToken(user._id),
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
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        userType: user.userType,
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

module.exports = router;