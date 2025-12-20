const express = require('express');
const router = express.Router();
const FeedbackMirror = require('../models/FeedbackMirror');
const { protect } = require('../middleware/authMiddleware');
const { sendSystemNotification } = require('../utils/notificationService');

// @route   GET /api/feedback
// @desc    Get feedback received by user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { recipientId: req.user._id };

    // Filter by type
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Filter by flagged status
    if (req.query.flagged === 'true') {
      filter.flaggedForModeration = true;
    }

    const feedback = await FeedbackMirror.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name username')
      .lean();

    // Hide sender info for anonymous feedback
    feedback.forEach((item) => {
      if (item.isAnonymous) {
        item.senderId = null;
      }
    });

    const total = await FeedbackMirror.countDocuments(filter);

    res.json({
      feedback,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/feedback/sent
// @desc    Get feedback sent by user
// @access  Private
router.get('/sent', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const feedback = await FeedbackMirror.find({ senderId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recipientId', 'name username')
      .lean();

    const total = await FeedbackMirror.countDocuments({ senderId: req.user._id });

    res.json({
      feedback,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get specific feedback entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const feedback = await FeedbackMirror.findById(req.params.id)
      .populate('senderId', 'name username')
      .populate('recipientId', 'name username')
      .lean();

    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }

    // Check if user is sender or recipient
    const isSender = feedback.senderId._id.toString() === req.user._id.toString();
    const isRecipient = feedback.recipientId._id.toString() === req.user._id.toString();

    if (!isSender && !isRecipient) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Hide sender for anonymous feedback (if user is recipient)
    if (feedback.isAnonymous && isRecipient) {
      feedback.senderId = null;
    }

    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/feedback
// @desc    Send feedback to another user
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, type, content, isAnonymous } = req.body;

    if (!recipientId || !type || !content) {
      return res.status(400).json({ msg: 'Please provide recipientId, type, and content' });
    }

    // Validate type
    const validTypes = ['Habit', 'Accountability', 'General'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ msg: 'Invalid feedback type' });
    }

    // Can't send feedback to yourself
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ msg: "You can't send feedback to yourself" });
    }

    // Content length validation
    if (content.length < 10) {
      return res.status(400).json({ msg: 'Feedback must be at least 10 characters' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ msg: 'Feedback must not exceed 1000 characters' });
    }

    const feedback = await FeedbackMirror.create({
      senderId: req.user._id,
      recipientId,
      type,
      content,
      isAnonymous: isAnonymous || false,
    });

    // Send notification to recipient (if Socket.IO available)
    // await sendSystemNotification(io, recipientId, 'You received new feedback!');

    res.status(201).json({
      msg: 'Feedback sent successfully',
      feedback,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/feedback/:id/flag
// @desc    Flag feedback for moderation
// @access  Private
router.put('/:id/flag', protect, async (req, res) => {
  try {
    const feedback = await FeedbackMirror.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }

    // Only recipient can flag feedback
    if (feedback.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only recipient can flag feedback' });
    }

    feedback.flaggedForModeration = true;
    await feedback.save();

    res.json({
      msg: 'Feedback flagged for moderation',
      feedback,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (sender only, within 24 hours)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const feedback = await FeedbackMirror.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }

    // Check if user is sender
    if (feedback.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Only sender can delete feedback' });
    }

    // Check if within 24 hours
    const hoursSinceCreation = (Date.now() - feedback.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(403).json({ msg: 'Cannot delete feedback after 24 hours' });
    }

    await feedback.deleteOne();

    res.json({ msg: 'Feedback deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/feedback/stats/summary
// @desc    Get feedback statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const received = await FeedbackMirror.countDocuments({ recipientId: req.user._id });
    const sent = await FeedbackMirror.countDocuments({ senderId: req.user._id });

    // Get feedback by type
    const byType = await FeedbackMirror.aggregate([
      { $match: { recipientId: req.user._id } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const stats = {
      received,
      sent,
      byType: {},
    };

    byType.forEach((item) => {
      stats.byType[item._id] = item.count;
    });

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
