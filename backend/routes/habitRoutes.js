const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const HabitTemplate = require('../models/HabitTemplate');
const UserHabit = require('../models/UserHabit');

// @route   GET /api/habits
// @desc    Get all habits for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Find all UserHabits for this user and populate the template details
    const habits = await UserHabit.find({ userId: req.user._id })
      .populate('templateId', 'name description category');
    
    res.json(habits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/habits
// @desc    Create a new habit (Creates a private Template + UserHabit)
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, category, description, dailyWindowStart, dailyWindowEnd } = req.body;

  try {
    // 1. Create a new "Private" Habit Template
    const newTemplate = new HabitTemplate({
      name,
      category: category || 'Wellness', // Default category
      description,
      creatorId: req.user._id,
      isPublic: false
    });

    const savedTemplate = await newTemplate.save();

    // 2. Link it to the user in UserHabit
    const newUserHabit = new UserHabit({
      userId: req.user._id,
      templateId: savedTemplate._id,
      dailyWindowStart,
      dailyWindowEnd
    });

    const savedUserHabit = await newUserHabit.save();

    res.status(201).json(savedUserHabit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;