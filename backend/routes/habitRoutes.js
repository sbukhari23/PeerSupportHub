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
  const { name, category, description, dailyWindowStart, dailyWindowEnd, userIntention } = req.body;

  try {
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ msg: 'Name and description are required' });
    }

    // 1. Check if a template with this name already exists for this creator
    let savedTemplate = await HabitTemplate.findOne({ creatorId: req.user._id, name });
    
    if (savedTemplate) {
      // Check if user already has a habit for this template
      const existingUserHabit = await UserHabit.findOne({ userId: req.user._id, templateId: savedTemplate._id });
      if (existingUserHabit) {
        return res.status(400).json({ msg: 'You already have this habit' });
      }
    } else {
      // Create a new Habit Template
      // If user is admin, make it public; otherwise private (requires admin approval)
      const isPublic = req.user.userType === 'admin';
      
      const newTemplate = new HabitTemplate({
        name,
        category: category || 'Wellness', // Default category
        description,
        creatorId: req.user._id,
        isPublic
      });

      savedTemplate = await newTemplate.save();
    }

    // 2. Link it to the user in UserHabit

    const newUserHabit = new UserHabit({
      userId: req.user._id,
      templateId: savedTemplate._id,
      userIntention: userIntention || '',
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

// @route   PUT /api/habits/:id
// @desc    Update a user's habit
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { userIntention, dailyWindowStart, dailyWindowEnd, name, description, category } = req.body;

    let userHabit = await UserHabit.findById(req.params.id).populate('templateId');

    if (!userHabit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if the habit belongs to the user
    if (userHabit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update UserHabit fields
    if (userIntention !== undefined) userHabit.userIntention = userIntention;
    if (dailyWindowStart !== undefined) userHabit.dailyWindowStart = dailyWindowStart;
    if (dailyWindowEnd !== undefined) userHabit.dailyWindowEnd = dailyWindowEnd;

    // Update template fields (name, description, category)
    if (name !== undefined || description !== undefined || category !== undefined) {
      const template = userHabit.templateId;
      
      // Check if this user owns the template and it's private
      if (template.creatorId.toString() === req.user._id.toString() && !template.isPublic) {
        // User owns a private template - safe to update directly
        if (name !== undefined) template.name = name;
        if (description !== undefined) template.description = description;
        if (category !== undefined) template.category = category;
        await template.save();
      } else {
        // Template is public or not owned by user - create a new private template
        const newTemplate = new HabitTemplate({
          name: name || template.name,
          category: category || template.category,
          description: description || template.description,
          creatorId: req.user._id,
          isPublic: false
        });
        
        const savedTemplate = await newTemplate.save();
        userHabit.templateId = savedTemplate._id;
      }
    }

    await userHabit.save();

    // Populate and return updated habit
    const updatedHabit = await UserHabit.findById(userHabit._id)
      .populate('templateId', 'name description category');

    res.json(updatedHabit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/habits/:id
// @desc    Delete a user's habit
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const userHabit = await UserHabit.findById(req.params.id).populate('templateId');

    if (!userHabit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    // Check if the habit belongs to the user or user is admin
    if (userHabit.userId.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Delete the UserHabit
    await userHabit.deleteOne();

    // If the template is private and owned by this user, delete it too
    const template = userHabit.templateId;
    if (template && !template.isPublic && template.creatorId.toString() === req.user._id.toString()) {
      // Check if any other users are using this template
      const otherUsersCount = await UserHabit.countDocuments({ templateId: template._id });
      
      // Only delete if no other users are using it
      if (otherUsersCount === 0) {
        await HabitTemplate.findByIdAndDelete(template._id);
      }
    }

    res.json({ msg: 'Habit deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;