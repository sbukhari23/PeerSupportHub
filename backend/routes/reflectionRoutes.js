const express = require('express');
const router = express.Router();
const ReflectionEntry = require('../models/ReflectionEntry');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/reflections
// @desc    Get user's reflection entries
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    // Filter by entry type
    if (req.query.type) {
      filter.entryType = req.query.type;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    const reflections = await ReflectionEntry.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReflectionEntry.countDocuments(filter);

    res.json({
      reflections,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/reflections/stats/summary
// @desc    Get reflection statistics (mood trends, entry counts)
// @access  Private
// NOTE: This route MUST be defined before /:id to avoid "stats" being treated as an ObjectId
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get entries from last N days
    const entries = await ReflectionEntry.find({
      userId: req.user._id,
      date: { $gte: startDate },
    }).lean();

    // Calculate stats
    const stats = {
      totalEntries: entries.length,
      byType: {},
      averageMood: 0,
      moodTrend: [],
      energyDistribution: { High: 0, Low: 0, Neutral: 0 },
    };

    // Count by type
    entries.forEach((entry) => {
      if (!stats.byType[entry.entryType]) {
        stats.byType[entry.entryType] = 0;
      }
      stats.byType[entry.entryType]++;

      // Mood calculation
      if (entry.moodRating) {
        stats.averageMood += entry.moodRating;
      }

      // Energy distribution
      if (entry.energyState) {
        stats.energyDistribution[entry.energyState]++;
      }
    });

    // Calculate average mood
    const moodEntries = entries.filter((e) => e.moodRating);
    if (moodEntries.length > 0) {
      stats.averageMood = (stats.averageMood / moodEntries.length).toFixed(2);
    }

    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/reflections/:id
// @desc    Get specific reflection entry
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const reflection = await ReflectionEntry.findById(req.params.id).lean();

    if (!reflection) {
      return res.status(404).json({ msg: 'Reflection entry not found' });
    }

    // Check ownership
    if (reflection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(reflection);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/reflections
// @desc    Create a new reflection entry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { entryType, date, content, moodRating, energyState } = req.body;

    if (!entryType || !date) {
      return res.status(400).json({ msg: 'Please provide entryType and date' });
    }

    // Validate entry type
    const validTypes = ['GratitudeLog', 'WeeklyReview', 'MoodEnergyLog'];
    if (!validTypes.includes(entryType)) {
      return res.status(400).json({ msg: 'Invalid entry type' });
    }

    // Validate mood rating if provided
    if (moodRating && (moodRating < 1 || moodRating > 5)) {
      return res.status(400).json({ msg: 'Mood rating must be between 1 and 5' });
    }

    // Validate energy state if provided
    if (energyState && !['High', 'Low', 'Neutral'].includes(energyState)) {
      return res.status(400).json({ msg: 'Invalid energy state' });
    }

    const reflection = await ReflectionEntry.create({
      userId: req.user._id,
      entryType,
      date: new Date(date),
      content,
      moodRating,
      energyState,
    });

    res.status(201).json({
      msg: 'Reflection entry created successfully',
      reflection,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT /api/reflections/:id
// @desc    Update a reflection entry
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const reflection = await ReflectionEntry.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ msg: 'Reflection entry not found' });
    }

    // Check ownership
    if (reflection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { content, moodRating, energyState } = req.body;

    // Update fields
    if (content !== undefined) reflection.content = content;
    if (moodRating !== undefined) {
      if (moodRating < 1 || moodRating > 5) {
        return res.status(400).json({ msg: 'Mood rating must be between 1 and 5' });
      }
      reflection.moodRating = moodRating;
    }
    if (energyState !== undefined) {
      if (!['High', 'Low', 'Neutral'].includes(energyState)) {
        return res.status(400).json({ msg: 'Invalid energy state' });
      }
      reflection.energyState = energyState;
    }

    await reflection.save();

    res.json({
      msg: 'Reflection entry updated successfully',
      reflection,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE /api/reflections/:id
// @desc    Delete a reflection entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reflection = await ReflectionEntry.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ msg: 'Reflection entry not found' });
    }

    // Check ownership
    if (reflection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await reflection.deleteOne();

    res.json({ msg: 'Reflection entry deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
