const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserHabit = require('../models/UserHabit');
const DailyLog = require('../models/DailyLog');
const BuddyRequest = require('../models/BuddyRequest');
const { protect } = require('../middleware/authMiddleware');
const { objectIdValidation, validate } = require('../middleware/validationMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/avatars/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only allow images
const avatarFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  },
});

// @route   GET /api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/profile
// @desc    Update profile (settings, etc.)
// @access  Private
router.put('/', protect, async (req, res) => {
  const { name, username, gender, onboardingIntent, settings } = req.body;

  // Build profile object
  const profileFields = {};
  if (name) profileFields.name = name;
  if (username) profileFields.username = username;
  if (gender) profileFields.gender = gender;
  if (onboardingIntent) profileFields.onboardingIntent = onboardingIntent;
  if (settings) profileFields.settings = settings;

  try {
    let user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found: unable to update profile' });
    }

    // Update
    user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error: unable to update profile');
  }
});

// @route   POST /api/profile/avatar
// @desc    Upload profile picture
// @access  Private
router.post('/avatar', protect, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }

    // Get the file path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old avatar if exists
    const user = await User.findById(req.user._id);
    if (user.avatarUrl) {
      const oldAvatarPath = path.join(__dirname, '..', user.avatarUrl);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user's avatarUrl
    user.avatarUrl = avatarUrl;
    await user.save();

    res.json({ avatarUrl, msg: 'Avatar uploaded successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error: unable to upload avatar');
  }
});

// @route   DELETE /api/profile/avatar
// @desc    Remove profile picture
// @access  Private
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.avatarUrl) {
      const avatarPath = path.join(__dirname, '..', user.avatarUrl);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    user.avatarUrl = null;
    await user.save();

    res.json({ msg: 'Avatar removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error: unable to remove avatar');
  }
});

// @route   GET /api/profile/stats
// @desc    Get user's overall stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // 1. Total active habits
    const activeHabitsCount = await UserHabit.countDocuments({
      userId: req.user._id,
      isActive: true,
    });

    // 2. Longest streak across all habits
    // We can find the max streak from all UserHabits for this user
    const habits = await UserHabit.find({ userId: req.user._id });
    let longestStreak = 0;
    habits.forEach((habit) => {
      if (habit.streak > longestStreak) {
        longestStreak = habit.streak;
      }
    });

    // 3. Overall completion rate
    // Strategy: (Total Completed Logs / Total Logs) * 100
    // First, get all userHabit IDs for this user
    const userHabitIds = habits.map((h) => h._id);
    
    const totalLogs = await DailyLog.countDocuments({
      userHabitId: { $in: userHabitIds },
    });

    const completedLogs = await DailyLog.countDocuments({
      userHabitId: { $in: userHabitIds },
      completionStatus: 'Completed',
    });

    const completionRate = totalLogs === 0 ? 0 : (completedLogs / totalLogs) * 100;

    // 4. Current progress score
    const currentProgressScore = req.user.currentProgressScore || 0;

    // 5. Total days logged
    const totalDaysLogged = totalLogs;

    res.json({
      totalActiveHabits: activeHabitsCount,
      longestStreak,
      completionRate: `${Math.round(completionRate * 10) / 10}%`, // Display-friendly percentage
      completionRateRaw: Math.round(completionRate * 10) / 10, // Raw number for calculations
      totalDaysLogged,
      currentProgressScore,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profile/search/users
// @desc    Search for users to send buddy requests
// @access  Private
router.get('/search/users', protect, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    // Get current user's buddies and pending requests
    const currentUser = await User.findById(currentUserId).select('buddies');
    const buddyIds = currentUser.buddies || [];

    // Get pending requests sent by current user
    const sentRequests = await BuddyRequest.find({
      sender: currentUserId,
      status: 'Pending',
    }).select('recipient');
    const pendingRecipientIds = sentRequests.map(r => r.recipient.toString());

    // Get pending requests received by current user
    const receivedRequests = await BuddyRequest.find({
      recipient: currentUserId,
      status: 'Pending',
    }).select('sender');
    const pendingSenderIds = receivedRequests.map(r => r.sender.toString());

    // Build search query
    let searchQuery = {
      _id: { $ne: currentUserId }, // Exclude self
    };

    // If search term provided, filter by name or username
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      searchQuery.$or = [
        { name: searchRegex },
        { username: searchRegex },
      ];
    }

    const users = await User.find(searchQuery)
      .select('name username currentProgressScore onboardingIntent avatarUrl')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    // Add status to each user
    const usersWithStatus = users.map(user => {
      const userId = user._id.toString();
      let buddyStatus = 'none';
      
      if (buddyIds.some(id => id.toString() === userId)) {
        buddyStatus = 'buddy';
      } else if (pendingRecipientIds.includes(userId)) {
        buddyStatus = 'pending_sent';
      } else if (pendingSenderIds.includes(userId)) {
        buddyStatus = 'pending_received';
      }

      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        currentProgressScore: user.currentProgressScore,
        onboardingIntent: user.onboardingIntent,
        avatarUrl: user.avatarUrl,
        buddyStatus,
      };
    });

    res.json(usersWithStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profile/buddy/requests
// @desc    Get all pending buddy requests
// @access  Private
router.get('/buddy/requests', protect, async (req, res) => {
  try {
    const requests = await BuddyRequest.find({
      recipient: req.user._id,
      status: 'Pending',
    }).populate('sender', 'name username currentProgressScore');

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profile/buddy/sent-requests
// @desc    Get all sent buddy requests (pending)
// @access  Private
router.get('/buddy/sent-requests', protect, async (req, res) => {
  try {
    const requests = await BuddyRequest.find({
      sender: req.user._id,
      status: 'Pending',
    }).populate('recipient', 'name username currentProgressScore');

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profile/buddies
// @desc    Get all current user's buddies
// @access  Private
router.get('/buddies', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('buddies', 'name username currentProgressScore onboardingIntent avatarUrl');

    res.json(user.buddies || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/profile/:userId
// @desc    View another user's public profile
// @access  Private
router.get(
  '/:userId',
  protect,
  ...objectIdValidation('userId'),
  validate,
  async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      'name username onboardingIntent'
    ); // Only return public info (name, username, bio)

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});


// @route   GET /api/profile/buddy/:userId
// @desc    View specific buddy's public profile (validates buddy relationship)
// @access  Private
router.get(
  '/buddy/:userId',
  protect,
  ...objectIdValidation('userId'),
  validate,
  async (req, res) => {
  try {
    const buddyUserId = req.params.userId;

    // Verify this user is actually your buddy
    const currentUser = await User.findById(req.user._id);
    if (!currentUser.buddies || !currentUser.buddies.some(id => id.toString() === buddyUserId)) {
      return res.status(403).json({ msg: 'This user is not your buddy' });
    }

    const user = await User.findById(buddyUserId).select(
      'name username currentProgressScore onboardingIntent'
    ); // Only return public info

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/profile/buddy/request/:userId
// @desc    Send a buddy request
// @access  Private
router.post(
  '/buddy/request/:userId',
  protect,
  ...objectIdValidation('userId'),
  validate,
  async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ msg: 'Cannot send request to self' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already buddies
    if (
      targetUser.buddies &&
      targetUser.buddies.some(buddyId => buddyId.toString() === req.user._id.toString())
    ) {
      return res.status(400).json({ msg: 'You are already buddies' });
    }

    // Check if request already sent (pending)
    const existingRequest = await BuddyRequest.findOne({
      sender: req.user._id,
      recipient: targetUserId,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({ msg: 'Request already sent' });
    }

    // Check if they sent YOU a request (pending)
    const reverseRequest = await BuddyRequest.findOne({
      sender: targetUserId,
      recipient: req.user._id,
      status: 'Pending',
    });

    if (reverseRequest) {
      return res
        .status(400)
        .json({ msg: 'This user has already sent you a request. Please accept it.' });
    }

    // Create new request
    const newRequest = new BuddyRequest({
      sender: req.user._id,
      recipient: targetUserId,
    });

    await newRequest.save();

    res.json({ msg: 'Buddy request sent' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/profile/buddy/accept/:requestId
// @desc    Accept a buddy request
// @access  Private
router.put(
  '/buddy/accept/:requestId',
  protect,
  ...objectIdValidation('requestId'),
  validate,
  async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const request = await BuddyRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify the recipient is the current user
    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ msg: 'Request is not pending' });
    }

    // 1. Update Request Status
    request.status = 'Accepted';
    await request.save();

    // 2. Add to buddies array for both users (without duplicates)
    await User.findByIdAndUpdate(req.user._id, { 
      $addToSet: { buddies: request.sender }
    });
    await User.findByIdAndUpdate(request.sender, { 
      $addToSet: { buddies: req.user._id }
    });

    res.json({ msg: 'Buddy request accepted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/profile/buddy/reject/:requestId
// @desc    Reject a buddy request
// @access  Private
router.put(
  '/buddy/reject/:requestId',
  protect,
  ...objectIdValidation('requestId'),
  validate,
  async (req, res) => {
  try {
    const requestId = req.params.requestId;

    const request = await BuddyRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    // Verify the recipient is the current user
    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update Status
    request.status = 'Rejected';
    await request.save();

    res.json({ msg: 'Buddy request rejected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
