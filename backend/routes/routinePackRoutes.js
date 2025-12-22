const express = require('express');
const router = express.Router();
const RoutinePack = require('../models/RoutinePack');
const HabitTemplate = require('../models/HabitTemplate');
const UserHabit = require('../models/UserHabit');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/routine-packs
// @desc    Browse all routine packs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.official === 'true') {
      filter.isOfficial = true;
    }

    const packs = await RoutinePack.find(filter)
      .sort({ downloadCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'name username')
      .populate('habitTemplates')
      .lean();

    const total = await RoutinePack.countDocuments(filter);

    res.json({
      packs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/routine-packs/:id
// @desc    Get routine pack details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const pack = await RoutinePack.findById(req.params.id)
      .populate('creatorId', 'name username')
      .populate('habitTemplates')
      .lean();

    if (!pack) {
      return res.status(404).json({ msg: 'Routine pack not found' });
    }

    res.json(pack);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/routine-packs/:id/adopt
// @desc    Adopt a routine pack (creates all habits from templates)
// @access  Private
router.post('/:id/adopt', protect, async (req, res) => {
  try {
    const pack = await RoutinePack.findById(req.params.id).populate('habitTemplates');

    if (!pack) {
      return res.status(404).json({ msg: 'Routine pack not found' });
    }

    if (!pack.habitTemplates || pack.habitTemplates.length === 0) {
      return res.status(400).json({ msg: 'This pack has no habit templates' });
    }

    // Create user habits from templates
    const createdHabits = [];

    for (const template of pack.habitTemplates) {
      // Check if user already has this habit
      const existingHabit = await UserHabit.findOne({
        userId: req.user._id,
        habitName: template.habitName,
      });

      if (existingHabit) {
        // Skip if already exists
        continue;
      }

      // Create new habit from template
      const newHabit = await UserHabit.create({
        userId: req.user._id,
        habitName: template.habitName,
        habitType: template.habitType,
        frequency: template.frequency,
        goal: template.goal,
        reminderTime: template.reminderTime,
        description: template.description || '',
        category: template.category || 'Other',
        icon: template.icon,
        color: template.color,
      });

      createdHabits.push(newHabit);
    }

    // Increment download count
    pack.downloadCount += 1;
    await pack.save();

    res.status(201).json({
      msg: `Successfully adopted ${createdHabits.length} habits from ${pack.packName}`,
      habits: createdHabits,
      skipped: pack.habitTemplates.length - createdHabits.length,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET /api/routine-packs/popular
// @desc    Get most popular routine packs
// @access  Public
router.get('/popular/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const packs = await RoutinePack.find()
      .sort({ downloadCount: -1 })
      .limit(limit)
      .populate('creatorId', 'name username')
      .populate('habitTemplates')
      .lean();

    res.json({ packs });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST /api/routine-packs
// @desc    Create a new routine pack (admin/moderator only)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { packName, description, habitTemplates, isOfficial } = req.body;

    if (!packName || !description) {
      return res.status(400).json({ msg: 'Please provide packName and description' });
    }

    // Check if pack already exists
    const existingPack = await RoutinePack.findOne({ packName });
    if (existingPack) {
      return res.status(400).json({ msg: 'Routine pack with this name already exists' });
    }

    const pack = await RoutinePack.create({
      packName,
      description,
      creatorId: req.user._id,
      habitTemplates: habitTemplates || [],
      isOfficial: isOfficial || false,
    });

    res.status(201).json({
      msg: 'Routine pack created successfully',
      pack,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
