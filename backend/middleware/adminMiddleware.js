const User = require('../models/User');

// Middleware to check if user is an admin
const adminOnly = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    if (!req.user) {
      return res.status(401).json({ msg: 'Not authorized, no user found' });
    }

    // Check if user type is Admin
    if (req.user.userType !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error in admin verification' });
  }
};

module.exports = { adminOnly };
