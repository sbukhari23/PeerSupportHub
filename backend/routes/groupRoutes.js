const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');
const { createLimiter } = require('../middleware/rateLimitMiddleware');
const { groupValidation, objectIdValidation, validate } = require('../middleware/validationMiddleware');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', createLimiter, protect, groupValidation, validate, async (req, res) => {
  const { name, type, topicFocus } = req.body;

  try {
    // Validate required fields
    if (!name) {
      return res.status(400).json({ msg: 'Please provide a group name' });
    }

    // Create new group with creator as first member and moderator
    const newGroup = new Group({
      name,
      type: type || 'FocusedSpace', // Default type
      topicFocus,
      members: [req.user._id],
      memberJoinDates: [{ memberId: req.user._id, joinedAt: new Date() }],
      moderators: [req.user._id], // Creator becomes moderator
    });

    const savedGroup = await newGroup.save();

    // Add group to user's pods array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pods: savedGroup._id },
    });

    res.status(201).json(savedGroup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/groups
// @desc    Get all public groups (or all groups for now)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name username')
      .populate('moderators', 'name username')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/groups/my
// @desc    Get current user's groups
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name username')
      .populate('moderators', 'name username')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group details
// @access  Private
router.get(
  '/:id',
  protect,
  ...objectIdValidation('id'),
  validate,
  async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name username email')
      .populate('moderators', 'name username');

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post(
  '/:id/join',
  protect,
  ...objectIdValidation('id'),
  validate,
  async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is already a member
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ msg: 'You are already a member of this group' });
    }

    // Add user to group members with join date
    group.members.push(req.user._id);
    group.memberJoinDates.push({ memberId: req.user._id, joinedAt: new Date() });
    await group.save();

    // Add group to user's pods array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { pods: group._id },
    });

    res.json({ msg: 'Successfully joined the group', group });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.delete(
  '/:id/leave',
  protect,
  ...objectIdValidation('id'),
  validate,
  async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ msg: 'You are not a member of this group' });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    // Remove user from memberJoinDates
    group.memberJoinDates = group.memberJoinDates.filter(
      (m) => m.memberId.toString() !== req.user._id.toString()
    );

    // If user was a moderator, remove them from moderators too
    group.moderators = group.moderators.filter(
      (mod) => mod.toString() !== req.user._id.toString()
    );

    await group.save();

    // Remove group from user's pods array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { pods: group._id },
    });

    res.json({ msg: 'Successfully left the group' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group details (moderators only)
// @access  Private
router.put(
  '/:id',
  protect,
  ...objectIdValidation('id'),
  validate,
  async (req, res) => {
  const { name, topicFocus, type } = req.body;

  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is a moderator
    if (!group.moderators.includes(req.user._id)) {
      return res.status(403).json({ msg: 'Only moderators can update group details' });
    }

    // Update fields
    if (name) group.name = name;
    if (topicFocus) group.topicFocus = topicFocus;
    if (type) group.type = type;

    await group.save();

    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group (moderators only)
// @access  Private
router.delete(
  '/:id',
  protect,
  ...objectIdValidation('id'),
  validate,
  async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is a moderator
    if (!group.moderators.includes(req.user._id)) {
      return res.status(403).json({ msg: 'Only moderators can delete the group' });
    }

    // Remove group from all members' pods
    await User.updateMany(
      { pods: group._id },
      { $pull: { pods: group._id } }
    );

    await Group.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Group deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
