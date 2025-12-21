const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const MentorSession = require('../models/MentorSession');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/mentors
// @desc    Get all available mentors (only approved ones)
// @access  Private (require login to see mentors)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      approvalStatus: 'approved', // Only show approved mentors
      userId: { $ne: req.user._id }, // Exclude current user
    };

    // Filter by expertise area
    if (req.query.expertise) {
      filter.expertise = { $in: [req.query.expertise] };
    }

    const mentors = await MentorProfile.find(filter)
      .populate('userId', 'name username email bio')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MentorProfile.countDocuments(filter);

    res.json({
      mentors,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/mentors/:id
// @desc    Get specific mentor profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id)
      .populate('userId', 'name username email bio')
      .lean();

    if (!mentor) {
      return res.status(404).json({ msg: 'Mentor not found' });
    }

    // Get completed sessions count
    const completedSessions = await MentorSession.countDocuments({
      mentorId: mentor.userId._id,
      status: 'completed',
    });

    res.json({
      ...mentor,
      completedSessions,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/mentors/profile
// @desc    Create or update mentor profile (application goes to pending)
// @access  Private
router.post('/profile', protect, async (req, res) => {
  try {
    const {
      expertise,
      bio,
      meetingLink,
      oneOnOneLink,
      monthlyQASchedule,
    } = req.body;

    // Check if profile exists
    let mentorProfile = await MentorProfile.findOne({ userId: req.user._id });

    if (mentorProfile) {
      // Update existing profile
      if (expertise) mentorProfile.expertise = expertise;
      if (bio) mentorProfile.bio = bio;
      if (meetingLink !== undefined) mentorProfile.meetingLink = meetingLink;
      if (oneOnOneLink) mentorProfile.oneOnOneLink = oneOnOneLink;
      if (monthlyQASchedule) mentorProfile.monthlyQASchedule = monthlyQASchedule;
      
      // If profile was rejected, resubmit as pending
      if (mentorProfile.approvalStatus === 'rejected') {
        mentorProfile.approvalStatus = 'pending';
        mentorProfile.rejectionReason = null;
      }

      await mentorProfile.save();

      res.json({
        msg: mentorProfile.approvalStatus === 'pending' 
          ? 'Mentor application submitted! Awaiting admin approval.' 
          : 'Mentor profile updated successfully',
        profile: mentorProfile,
      });
    } else {
      // Create new profile with pending status
      mentorProfile = await MentorProfile.create({
        userId: req.user._id,
        expertise: expertise || [],
        bio: bio || 'Experienced mentor',
        meetingLink: meetingLink || '',
        oneOnOneLink,
        monthlyQASchedule,
        approvalStatus: 'pending', // Always starts as pending
        isVerified: false,
      });

      res.status(201).json({
        msg: 'Mentor application submitted! Awaiting admin approval.',
        profile: mentorProfile,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/mentors/profile/me
// @desc    Get current user's mentor profile
// @access  Private (Mentor)
router.get('/profile/me', protect, async (req, res) => {
  try {
    const profile = await MentorProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name username email')
      .lean();

    if (!profile) {
      return res.status(404).json({ msg: 'Mentor profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/mentors/:mentorId/book
// @desc    Book a session with a mentor
// @access  Private
router.post('/:mentorId/book', protect, async (req, res) => {
  try {
    const { sessionDate, duration, topic, notes } = req.body;

    if (!sessionDate || !topic) {
      return res.status(400).json({ msg: 'Please provide session date and topic' });
    }

    // Validate mentor exists and is approved
    const mentorProfile = await MentorProfile.findOne({
      userId: req.params.mentorId,
      approvalStatus: 'approved',
    });

    if (!mentorProfile) {
      return res.status(404).json({ msg: 'Mentor not found or not approved' });
    }

    // Prevent booking with yourself
    if (req.params.mentorId === req.user._id.toString()) {
      return res.status(400).json({ msg: 'Cannot book session with yourself' });
    }

    // Check if session date is in the future
    if (new Date(sessionDate) < new Date()) {
      return res.status(400).json({ msg: 'Session date must be in the future' });
    }

    // Create session with meeting link from mentor profile
    const session = await MentorSession.create({
      mentorId: req.params.mentorId,
      menteeId: req.user._id,
      sessionDate: new Date(sessionDate),
      duration: duration || 60,
      topic,
      notes,
      status: 'scheduled',
      meetingLink: mentorProfile.meetingLink || '', // Copy meeting link from mentor profile
    });

    await session.populate('mentorId', 'name username email');
    await session.populate('menteeId', 'name username email');

    res.status(201).json({
      msg: 'Session booked successfully',
      session,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/mentors/sessions/upcoming
// @desc    Get user's upcoming sessions (as mentor or mentee)
// @access  Private
router.get('/sessions/upcoming', protect, async (req, res) => {
  try {
    const [asMentor, asMentee] = await Promise.all([
      MentorSession.getMentorUpcomingSessions(req.user._id),
      MentorSession.getMenteeUpcomingSessions(req.user._id),
    ]);

    res.json({
      asMentor,
      asMentee,
      total: asMentor.length + asMentee.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/mentors/sessions/history
// @desc    Get user's session history
// @access  Private
router.get('/sessions/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [{ mentorId: req.user._id }, { menteeId: req.user._id }],
      status: { $in: ['completed', 'cancelled', 'no-show'] },
    };

    const sessions = await MentorSession.find(filter)
      .populate('mentorId', 'name username')
      .populate('menteeId', 'name username')
      .sort({ sessionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MentorSession.countDocuments(filter);

    res.json({
      sessions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/mentors/sessions/:id
// @desc    Get specific session details
// @access  Private
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await MentorSession.findById(req.params.id)
      .populate('mentorId', 'name username email')
      .populate('menteeId', 'name username email')
      .lean();

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if user is involved in the session
    const isInvolved =
      session.mentorId._id.toString() === req.user._id.toString() ||
      session.menteeId._id.toString() === req.user._id.toString();

    if (!isInvolved) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/mentors/sessions/:id/complete
// @desc    Mark session as completed (mentor only)
// @access  Private (Mentor)
router.put('/sessions/:id/complete', protect, async (req, res) => {
  try {
    const { notes } = req.body;

    const session = await MentorSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Only mentor can mark as completed
    if (session.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only mentor can complete session' });
    }

    await session.complete(notes);

    res.json({
      msg: 'Session marked as completed',
      session,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/mentors/sessions/:id/cancel
// @desc    Cancel a session
// @access  Private
router.put('/sessions/:id/cancel', protect, async (req, res) => {
  try {
    const session = await MentorSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Check if user is involved
    const isInvolved =
      session.mentorId.toString() === req.user._id.toString() ||
      session.menteeId.toString() === req.user._id.toString();

    if (!isInvolved) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Can't cancel past sessions
    if (session.sessionDate < new Date()) {
      return res.status(400).json({ msg: 'Cannot cancel past sessions' });
    }

    await session.cancel();

    res.json({
      msg: 'Session cancelled successfully',
      session,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/mentors/sessions/:id/rate
// @desc    Rate a completed session (mentee only)
// @access  Private (Mentee)
router.post('/sessions/:id/rate', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    const session = await MentorSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Only mentee can rate
    if (session.menteeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only mentee can rate session' });
    }

    // Only completed sessions can be rated
    if (session.status !== 'completed') {
      return res.status(400).json({ msg: 'Can only rate completed sessions' });
    }

    session.rating = rating;
    session.feedback = feedback;
    await session.save();

    // Update mentor's average rating
    const mentorProfile = await MentorProfile.findOne({ userId: session.mentorId });
    if (mentorProfile) {
      const ratedSessions = await MentorSession.find({
        mentorId: session.mentorId,
        status: 'completed',
        rating: { $exists: true },
      });

      const avgRating =
        ratedSessions.reduce((sum, s) => sum + s.rating, 0) / ratedSessions.length;

      mentorProfile.rating = Math.round(avgRating * 10) / 10;
      mentorProfile.totalSessions = ratedSessions.length;
      await mentorProfile.save();
    }

    res.json({
      msg: 'Session rated successfully',
      session,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
