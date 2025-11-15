const express = require('express');
const router = express.Router();
const User = require('../models/User'); // We ../ to go UP from routes into models

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  // We will get the user's data from the request body
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // If not, create a new User instance
    user = new User({
      name,
      email,
      password,
    });

    // Save the new user to the database
    await user.save();

    // For now, just send a success message
    res.status(201).json({ msg: 'User registered successfully' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;