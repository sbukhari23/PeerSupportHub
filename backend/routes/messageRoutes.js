const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

// Helper function to check group membership
const checkGroupMembership = async (userId, groupId) => {
  const group = await Group.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  const isMember = group.members.some((member) => member.toString() === userId.toString());
  if (!isMember) {
    throw new Error('You are not a member of this group');
  }
  return group;
};

// Helper function to check if user is moderator
const isGroupModerator = (group, userId) => {
  return group.moderators.some((mod) => mod.toString() === userId.toString());
};

// @route   POST /api/messages/:groupId
// @desc    Send message to group (with optional images)
// @access  Private
router.post('/:groupId', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { content, isAnonymous } = req.body;
    const groupId = req.params.groupId;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check group membership
    const group = await checkGroupMembership(req.user._id, groupId);

    // Only allow anonymous messages in AnonymousVent groups
    const shouldBeAnonymous = isAnonymous === 'true' && group.type === 'AnonymousVent';

    // Get uploaded image paths
    const imagePaths = req.files ? req.files.map((file) => `/uploads/messages/${file.filename}`) : [];

    // Create message
    const message = await Message.create({
      groupId,
      senderId: req.user._id,
      content: content.trim(),
      images: imagePaths,
      isAnonymous: shouldBeAnonymous,
    });

    // Populate sender info (unless anonymous)
    await message.populate('senderId', 'name username');

    // Hide sender info if anonymous
    const responseMessage = message.toObject();
    if (responseMessage.isAnonymous) {
      responseMessage.senderId = {
        name: 'Anonymous',
        username: 'anonymous',
      };
    }

    res.status(201).json(responseMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/messages/:groupId
// @desc    Get group messages with pagination
// @access  Private
router.get('/:groupId', protect, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { page = 1, limit = 50 } = req.query;

    // Check group membership
    await checkGroupMembership(req.user._id, groupId);

    // Get messages with pagination
    const messages = await Message.find({ groupId })
      .populate('senderId', 'name username')
      .populate('reactions.userId', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Hide sender info for anonymous messages
    const processedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
      if (msgObj.isAnonymous) {
        msgObj.senderId = {
          _id: msgObj.senderId._id,
          name: 'Anonymous',
          username: 'anonymous',
        };
      }
      return msgObj;
    });

    const count = await Message.countDocuments({ groupId });

    res.json({
      messages: processedMessages,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalMessages: count,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/messages/:messageId
// @desc    Edit own message (within 5 minutes)
// @access  Private
router.put('/:messageId', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own messages' });
    }

    // Check if within 5-minute edit window
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo) {
      return res.status(403).json({ message: 'Edit window expired (5 minutes)' });
    }

    // Validate new content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Update message
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    await message.populate('senderId', 'name username');

    // Hide sender info if anonymous
    const responseMessage = message.toObject();
    if (responseMessage.isAnonymous) {
      responseMessage.senderId = {
        name: 'Anonymous',
        username: 'anonymous',
      };
    }

    res.json(responseMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/messages/:messageId
// @desc    Delete own message (sender or moderator)
// @access  Private
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or group moderator
    const isSender = message.senderId.toString() === req.user._id.toString();
    const group = await Group.findById(message.groupId);
    const isModerator = isGroupModerator(group, req.user._id);

    if (!isSender && !isModerator) {
      return res.status(403).json({ message: 'Only sender or moderator can delete this message' });
    }

    await message.deleteOne();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/messages/:messageId/react
// @desc    Add emoji reaction to message
// @access  Private
router.post('/:messageId/react', protect, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Validate emoji
    if (!emoji || emoji.trim().length === 0) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    // Check group membership
    await checkGroupMembership(req.user._id, message.groupId);

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction (toggle)
      message.reactions = message.reactions.filter(
        (r) => !(r.userId.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({
        userId: req.user._id,
        emoji: emoji.trim(),
      });
    }

    await message.save();
    await message.populate('reactions.userId', 'name username');

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/messages/:messageId/flag
// @desc    Flag message for moderation
// @access  Private
router.post('/:messageId/flag', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check group membership
    await checkGroupMembership(req.user._id, message.groupId);

    // Flag message
    message.flaggedForModeration = true;
    await message.save();

    res.json({ message: 'Message flagged for moderation' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ==================== DIRECT MESSAGING ROUTES ====================

// @route   POST /api/messages/direct/:userId
// @desc    Send direct message to another user (with optional images)
// @access  Private
router.post('/direct/:userId', protect, upload.array('images', 5), async (req, res) => {
  try {
    const { content } = req.body;
    const recipientId = req.params.userId;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Cannot send message to yourself
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Get uploaded image paths
    const imagePaths = req.files ? req.files.map((file) => `/uploads/messages/${file.filename}`) : [];

    // Create direct message
    const message = await Message.create({
      senderId: req.user._id,
      recipientId,
      content: content.trim(),
      images: imagePaths,
      isAnonymous: false, // DMs are never anonymous
    });

    // Populate sender and recipient info
    await message.populate('senderId', 'name username');
    await message.populate('recipientId', 'name username');

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/messages/direct/:userId
// @desc    Get direct message history with a specific user (with pagination)
// @access  Private
router.get('/direct/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between the two users (both directions)
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user._id },
      ],
      groupId: { $exists: false }, // Ensure it's a DM, not group message
    })
      .populate('senderId', 'name username')
      .populate('recipientId', 'name username')
      .populate('reactions.userId', 'name username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Message.countDocuments({
      $or: [
        { senderId: req.user._id, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: req.user._id },
      ],
      groupId: { $exists: false },
    });

    res.json({
      messages,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalMessages: count,
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        username: otherUser.username,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get list of all conversations (users you've messaged with)
// @access  Private
router.get('/conversations/list', protect, async (req, res) => {
  try {
    // Find all unique users the current user has messaged with
    const sentMessages = await Message.find({
      senderId: req.user._id,
      recipientId: { $exists: true },
    })
      .select('recipientId createdAt content')
      .sort({ createdAt: -1 });

    const receivedMessages = await Message.find({
      recipientId: req.user._id,
      senderId: { $exists: true },
    })
      .select('senderId createdAt content')
      .sort({ createdAt: -1 });

    // Create a map of conversations with last message
    const conversationsMap = new Map();

    // Process sent messages
    sentMessages.forEach((msg) => {
      const userId = msg.recipientId.toString();
      if (!conversationsMap.has(userId)) {
        conversationsMap.set(userId, {
          userId,
          lastMessage: msg.content,
          lastMessageDate: msg.createdAt,
        });
      }
    });

    // Process received messages
    receivedMessages.forEach((msg) => {
      const userId = msg.senderId.toString();
      const existing = conversationsMap.get(userId);
      if (!existing || msg.createdAt > existing.lastMessageDate) {
        conversationsMap.set(userId, {
          userId,
          lastMessage: msg.content,
          lastMessageDate: msg.createdAt,
        });
      }
    });

    // Get user details for all conversations
    const userIds = Array.from(conversationsMap.keys());
    const users = await User.find({ _id: { $in: userIds } }).select('name username');

    // Build conversation list with user details
    const conversations = users.map((user) => {
      const conv = conversationsMap.get(user._id.toString());
      return {
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
        },
        lastMessage: conv.lastMessage,
        lastMessageDate: conv.lastMessageDate,
      };
    });

    // Sort by most recent message
    conversations.sort((a, b) => b.lastMessageDate - a.lastMessageDate);

    res.json({ conversations });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/messages/direct/:messageId
// @desc    Delete direct message (sender only)
// @access  Private
router.delete('/direct/:messageId', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Ensure it's a direct message
    if (!message.recipientId) {
      return res.status(400).json({ message: 'This is not a direct message' });
    }

    // Only sender can delete their DM
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await message.deleteOne();

    res.json({ message: 'Direct message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
