const express = require('express');
const router = express.Router();
const User = require('../models/User'); // We ../ to go UP from routes into models

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, username, userType } = req.body;

  try {
    // MANUAL CHECK: If registering via this route, password IS required
    if (!password) {
      return res.status(400).json({ msg: 'Please provide a password' });
    }

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create user (The pre-save hook in User.js will handle the hashing!)
    user = new User({
      name,
      email,
      password, // Pass plain text here; User.js converts it to hash
      username,
      userType: userType || 'User',
    });

    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;