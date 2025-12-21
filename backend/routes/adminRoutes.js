const express = require('express'); // importing express
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const FeedbackMirror = require('../models/FeedbackMirror');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All routes require authentication + admin privileges
router.use(protect, adminOnly);

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Admin only
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalGroups,
      totalMessages,
      activeUsersToday,
      flaggedContent,
      newUsersThisWeek,
    ] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({
        lastActiveAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      FeedbackMirror.countDocuments({ flaggedForModeration: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      totalUsers,
      totalGroups,
      totalMessages,
      activeUsersToday,
      flaggedContent,
      newUsersThisWeek,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Admin only
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by user type
    if (req.query.userType) {
      filter.userType = req.query.userType;
    }

    // Filter by verification status
    if (req.query.verified !== undefined) {
      filter.isEmailVerified = req.query.verified === 'true';
    }

    // Search by name or email
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get specific user details
// @access  Admin only
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('pods')
      .lean();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (change type, ban, etc.)
// @access  Admin only
router.put('/users/:id', async (req, res) => {
  try {
    const { userType, isEmailVerified, bio, preferredCategories } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent self-demotion from admin
    if (req.user._id.toString() === user._id.toString() && userType && userType !== 'Admin') {
      return res.status(400).json({ msg: 'Cannot demote yourself from admin' });
    }

    // Update fields
    if (userType) user.userType = userType;
    if (isEmailVerified !== undefined) user.isEmailVerified = isEmailVerified;
    if (bio !== undefined) user.bio = bio;
    if (preferredCategories) user.preferredCategories = preferredCategories;

    await user.save();

    res.json({
      msg: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user account
// @access  Admin only
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ msg: 'Cannot delete your own admin account' });
    }

    await user.deleteOne();

    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/admin/groups
// @desc    Get all groups
// @access  Admin only
router.get('/groups', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.groupType) {
      filter.groupType = req.query.groupType;
    }

    const groups = await Group.find(filter)
      .populate('members', 'name username')
      .populate('moderators', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Group.countDocuments(filter);

    res.json({
      groups,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/admin/groups/:id
// @desc    Delete group
// @access  Admin only
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    await group.deleteOne();

    res.json({ msg: 'Group deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/admin/flagged-content
// @desc    Get flagged feedback/messages
// @access  Admin only
router.get('/flagged-content', async (req, res) => {
  try {
    const [flaggedFeedback, flaggedMessages] = await Promise.all([
      FeedbackMirror.find({ flaggedForModeration: true })
        .populate('senderId', 'name username')
        .populate('recipientId', 'name username')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Message.find({ flaggedForModeration: true })
        .populate('senderId', 'name username')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      flaggedFeedback,
      flaggedMessages,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/feedback/:id/resolve
// @desc    Resolve flagged feedback
// @access  Admin only
router.put('/feedback/:id/resolve', async (req, res) => {
  try {
    const feedback = await FeedbackMirror.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }

    feedback.flaggedForModeration = false;
    await feedback.save();

    res.json({ msg: 'Feedback resolved', feedback });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/admin/feedback/:id
// @desc    Delete flagged feedback
// @access  Admin only
router.delete('/feedback/:id', async (req, res) => {
  try {
    const feedback = await FeedbackMirror.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }

    await feedback.deleteOne();

    res.json({ msg: 'Feedback deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/messages/:id/resolve
// @desc    Resolve flagged message
// @access  Admin only
router.put('/messages/:id/resolve', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    message.flaggedForModeration = false;
    await message.save();

    res.json({ msg: 'Message resolved', message });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/admin/messages/:id
// @desc    Delete flagged message
// @access  Admin only
router.delete('/messages/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    await message.deleteOne();

    res.json({ msg: 'Message deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
