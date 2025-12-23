const express = require('express'); // importing express
const router = express.Router();
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const FeedbackMirror = require('../models/FeedbackMirror');
const MentorProfile = require('../models/MentorProfile');
const HabitTemplate = require('../models/HabitTemplate');
const UserHabit = require('../models/UserHabit');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendMentorApprovedNotification, sendMentorRejectedNotification } = require('../utils/notificationService');

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
      totalHabits,
      flaggedContent,
      newUsersThisWeek,
    ] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Message.countDocuments(),
      UserHabit.countDocuments(),
      FeedbackMirror.countDocuments({ flaggedForModeration: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.json({
      totalUsers,
      totalGroups,
      totalMessages,
      totalHabits,
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

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban a user
// @access  Admin only
router.put('/users/:id/ban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent self-ban
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ msg: 'Cannot ban yourself' });
    }

    // Prevent banning other admins
    if (user.userType === 'Admin') {
      return res.status(400).json({ msg: 'Cannot ban another admin' });
    }

    user.isBanned = true;
    user.bannedAt = new Date();
    await user.save();

    res.json({ 
      msg: 'User banned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/users/:id/unban
// @desc    Unban a user
// @access  Admin only
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isBanned = false;
    user.bannedAt = undefined;
    await user.save();

    res.json({ 
      msg: 'User unbanned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBanned: user.isBanned
      }
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

// ==========================================
// MENTOR APPLICATION MANAGEMENT
// ==========================================

// @route   GET /api/admin/mentor-applications
// @desc    Get all pending mentor applications
// @access  Admin only
router.get('/mentor-applications', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status !== 'all') {
      filter.approvalStatus = status;
    }

    const applications = await MentorProfile.find(filter)
      .populate('userId', 'name email username avatarUrl createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MentorProfile.countDocuments(filter);
    const pendingCount = await MentorProfile.countDocuments({ approvalStatus: 'pending' });

    res.json({
      applications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      pendingCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/mentor-applications/:id/approve
// @desc    Approve a mentor application
// @access  Admin only
router.put('/mentor-applications/:id/approve', async (req, res) => {
  try {
    const mentorProfile = await MentorProfile.findById(req.params.id);

    if (!mentorProfile) {
      return res.status(404).json({ msg: 'Mentor application not found' });
    }

    if (mentorProfile.approvalStatus === 'approved') {
      return res.status(400).json({ msg: 'Application already approved' });
    }

    // Approve the mentor
    mentorProfile.approvalStatus = 'approved';
    mentorProfile.isVerified = true;
    mentorProfile.rejectionReason = null;
    await mentorProfile.save();

    // Update user type to Mentor
    await User.findByIdAndUpdate(mentorProfile.userId, { userType: 'Mentor' });

    // Send notification to the mentor (pass null for io since we don't have socket access here)
    await sendMentorApprovedNotification(null, mentorProfile.userId);

    res.json({
      msg: 'Mentor application approved successfully',
      profile: mentorProfile,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/mentor-applications/:id/reject
// @desc    Reject a mentor application
// @access  Admin only
router.put('/mentor-applications/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body || {};

    const mentorProfile = await MentorProfile.findById(req.params.id);

    if (!mentorProfile) {
      return res.status(404).json({ msg: 'Mentor application not found' });
    }

    if (mentorProfile.approvalStatus === 'rejected') {
      return res.status(400).json({ msg: 'Application already rejected' });
    }

    // Reject the mentor
    mentorProfile.approvalStatus = 'rejected';
    mentorProfile.rejectionReason = reason || 'Your application did not meet our current requirements.';
    mentorProfile.isVerified = false;
    await mentorProfile.save();

    // If user was a mentor, revert to regular user
    const user = await User.findById(mentorProfile.userId);
    if (user && user.userType === 'Mentor') {
      user.userType = 'User';
      await user.save();
    }

    // Send notification to the user (pass null for io since we don't have socket access here)
    await sendMentorRejectedNotification(null, mentorProfile.userId, mentorProfile.rejectionReason);

    res.json({
      msg: 'Mentor application rejected',
      profile: mentorProfile,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/admin/mentor-applications/:id
// @desc    Get a specific mentor application
// @access  Admin only
router.get('/mentor-applications/:id', async (req, res) => {
  try {
    const application = await MentorProfile.findById(req.params.id)
      .populate('userId', 'name email username avatarUrl bio createdAt')
      .lean();

    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ==================== HABIT TEMPLATE MANAGEMENT ====================

// @route   GET /api/admin/habit-templates
// @desc    Get all habit templates with filters
// @access  Admin only
router.get('/habit-templates', async (req, res) => {
  try {
    const filter = {};
    
    // Filter by public status
    if (req.query.isPublic !== undefined) {
      filter.isPublic = req.query.isPublic === 'true';
    }
    
    const templates = await HabitTemplate.find(filter)
      .populate('creatorId', 'name email username')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/habit-templates/:id/approve
// @desc    Approve a habit template (make it public)
// @access  Admin only
router.put('/habit-templates/:id/approve', async (req, res) => {
  try {
    const template = await HabitTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    if (template.isPublic) {
      return res.status(400).json({ msg: 'Template is already public' });
    }
    
    template.isPublic = true;
    await template.save();
    
    const populatedTemplate = await HabitTemplate.findById(template._id)
      .populate('creatorId', 'name email username')
      .lean();
    
    res.json({
      msg: 'Template approved and made public',
      template: populatedTemplate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/admin/habit-templates/:id/revoke
// @desc    Revoke a habit template's public status
// @access  Admin only
router.put('/habit-templates/:id/revoke', async (req, res) => {
  try {
    const template = await HabitTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    if (!template.isPublic) {
      return res.status(400).json({ msg: 'Template is not public' });
    }
    
    template.isPublic = false;
    await template.save();
    
    const populatedTemplate = await HabitTemplate.findById(template._id)
      .populate('creatorId', 'name email username')
      .lean();
    
    res.json({
      msg: 'Template public status revoked',
      template: populatedTemplate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/admin/habit-templates/:id
// @desc    Delete a habit template
// @access  Admin only
router.delete('/habit-templates/:id', async (req, res) => {
  try {
    const template = await HabitTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ msg: 'Template not found' });
    }
    
    await HabitTemplate.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Template deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
