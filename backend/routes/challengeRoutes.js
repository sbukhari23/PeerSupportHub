const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const { protect } = require('../middleware/authMiddleware');
const {
  calculateChallengeRankings,
  getChallengeLeaderboard,
  getGlobalLeaderboard,
  getUserRankInChallenge,
  getTrendingChallenges,
} = require('../utils/leaderboardService');
const { sendChallengeInviteNotification, sendChallengeCompleteNotification } = require('../utils/notificationService');

// @route   GET /api/challenges
// @desc    Browse all active challenges
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
      isActive: true,
      isPublic: true,
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.difficulty) {
      filter.difficulty = req.query.difficulty;
    }

    // Only show ongoing or future challenges
    if (req.query.status === 'ongoing') {
      filter.startDate = { $lte: new Date() };
      filter.endDate = { $gte: new Date() };
    } else if (req.query.status === 'upcoming') {
      filter.startDate = { $gt: new Date() };
    }

    const challenges = await Challenge.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name username')
      .lean();

    const total = await Challenge.countDocuments(filter);

    res.json({
      challenges,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/challenges/trending
// @desc    Get trending challenges
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 5;

    const trending = await getTrendingChallenges(days, limit);

    res.json({ trending });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/challenges/my
// @desc    Get user's challenges
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const status = req.query.status; // 'active', 'completed', 'failed'

    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const participations = await ChallengeParticipation.find(filter)
      .populate('challengeId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ challenges: participations });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/challenges/:id
// @desc    Get challenge details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'name username')
      .lean();

    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }

    // Add participation stats
    const participantCount = challenge.participants.length;
    const leaderboard = await getChallengeLeaderboard(challenge._id, 5);

    res.json({
      ...challenge,
      participantCount,
      topParticipants: leaderboard,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/challenges/:id/join
// @desc    Join a challenge
// @access  Private
router.post('/:id/join', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }

    // Check if user can join
    const { canJoin, reason } = challenge.canUserJoin(req.user._id);
    if (!canJoin) {
      return res.status(400).json({ msg: reason });
    }

    // Check if already participating
    const existingParticipation = await ChallengeParticipation.findOne({
      challengeId: challenge._id,
      userId: req.user._id,
    });

    if (existingParticipation) {
      return res.status(400).json({ msg: 'Already joined this challenge' });
    }

    // Create participation
    const participation = await ChallengeParticipation.create({
      challengeId: challenge._id,
      userId: req.user._id,
      status: 'active',
    });

    // Add user to challenge participants
    challenge.participants.push(req.user._id);
    await challenge.save();

    res.status(201).json({
      msg: 'Successfully joined challenge',
      participation,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/challenges/:id/leaderboard
// @desc    Get challenge leaderboard
// @access  Public
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Calculate rankings first
    await calculateChallengeRankings(req.params.id);

    const leaderboard = await getChallengeLeaderboard(req.params.id, limit);

    // If user is logged in from protect middleware, get their rank
    let userRank = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract user from token
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userRank = await getUserRankInChallenge(req.params.id, decoded.id);
      } catch (error) {
        // Token invalid, just don't include user rank
      }
    }

    res.json({
      leaderboard,
      userRank,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/challenges/:id/log
// @desc    Log progress for a challenge
// @access  Private
router.post('/:id/log', protect, async (req, res) => {
  try {
    const { value, note } = req.body;

    if (!value || value < 0) {
      return res.status(400).json({ msg: 'Please provide a valid progress value' });
    }

    const participation = await ChallengeParticipation.findOne({
      challengeId: req.params.id,
      userId: req.user._id,
    });

    if (!participation) {
      return res.status(404).json({ msg: 'You are not participating in this challenge' });
    }

    if (participation.status !== 'active') {
      return res.status(400).json({ msg: 'This challenge participation is not active' });
    }

    // Add check-in
    await participation.addCheckIn(value, note);

    // Update rankings
    await calculateChallengeRankings(req.params.id);

    // Get updated rank
    const userRank = await getUserRankInChallenge(req.params.id, req.user._id);

    res.json({
      msg: 'Progress logged successfully',
      participation,
      rank: userRank,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/challenges/:id/progress
// @desc    Update challenge progress
// @access  Private
router.put('/:id/progress', protect, async (req, res) => {
  try {
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ msg: 'Progress must be between 0 and 100' });
    }

    const participation = await ChallengeParticipation.findOne({
      challengeId: req.params.id,
      userId: req.user._id,
    });

    if (!participation) {
      return res.status(404).json({ msg: 'You are not participating in this challenge' });
    }

    await participation.updateProgress(progress);

    // If completed, send notification
    if (participation.status === 'completed') {
      const challenge = await Challenge.findById(req.params.id);
      const userRank = await getUserRankInChallenge(req.params.id, req.user._id);
      
      // Get Socket.IO instance from app (will be passed later)
      // await sendChallengeCompleteNotification(io, req.user._id, challenge.title, userRank.rank);
    }

    res.json({
      msg: 'Progress updated successfully',
      participation,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/challenges/:id/leave
// @desc    Leave/abandon a challenge
// @access  Private
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const participation = await ChallengeParticipation.findOne({
      challengeId: req.params.id,
      userId: req.user._id,
    });

    if (!participation) {
      return res.status(404).json({ msg: 'You are not participating in this challenge' });
    }

    // Update status to abandoned
    participation.status = 'abandoned';
    await participation.save();

    // Remove from challenge participants
    await Challenge.findByIdAndUpdate(req.params.id, {
      $pull: { participants: req.user._id },
    });

    res.json({ msg: 'Successfully left the challenge' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/challenges/leaderboard/global
// @desc    Get global leaderboard
// @access  Public
router.get('/leaderboard/global', async (req, res) => {
  try {
    const period = req.query.period || 'all-time'; // 'weekly', 'monthly', 'all-time'
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await getGlobalLeaderboard(period, limit);

    res.json({ leaderboard, period });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
