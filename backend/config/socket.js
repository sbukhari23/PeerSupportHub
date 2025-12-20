const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token and attaches userId to socket
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

/**
 * Setup Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 */
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // User joins their personal notification room
    socket.join(`user-${socket.userId}`);

    // ==================== GROUP MESSAGING EVENTS ====================

    // Join group room
    socket.on('join-group', async (groupId) => {
      try {
        // Verify user is a member of the group
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        const isMember = group.members.some((member) => member.toString() === socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        socket.join(`group-${groupId}`);
        console.log(`User ${socket.userId} joined group ${groupId}`);
        socket.emit('joined-group', { groupId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Leave group room
    socket.on('leave-group', (groupId) => {
      socket.leave(`group-${groupId}`);
      console.log(`User ${socket.userId} left group ${groupId}`);
    });

    // Send real-time message to group
    socket.on('send-message', async (data) => {
      try {
        const { groupId, content, isAnonymous } = data;

        // Verify group membership
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        const isMember = group.members.some((member) => member.toString() === socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // Only allow anonymous in AnonymousVent groups
        const shouldBeAnonymous = isAnonymous && group.type === 'AnonymousVent';

        // Create message in database
        const message = await Message.create({
          groupId,
          senderId: socket.userId,
          content: content.trim(),
          isAnonymous: shouldBeAnonymous,
        });

        await message.populate('senderId', 'name username');

        // Prepare response
        const responseMessage = message.toObject();
        if (responseMessage.isAnonymous) {
          responseMessage.senderId = {
            name: 'Anonymous',
            username: 'anonymous',
          };
        }

        // Broadcast to all users in the group room
        io.to(`group-${groupId}`).emit('new-message', responseMessage);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator for groups
    socket.on('typing', (data) => {
      const { groupId, isTyping } = data;
      socket.to(`group-${groupId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // ==================== DIRECT MESSAGING EVENTS ====================

    // Join DM room (private conversation between two users)
    socket.on('join-dm', (otherUserId) => {
      // Create a consistent room name regardless of who joins first
      const roomName = [socket.userId, otherUserId].sort().join('-');
      socket.join(`dm-${roomName}`);
      console.log(`User ${socket.userId} joined DM with ${otherUserId}`);
      socket.emit('joined-dm', { otherUserId, roomName });
    });

    // Leave DM room
    socket.on('leave-dm', (otherUserId) => {
      const roomName = [socket.userId, otherUserId].sort().join('-');
      socket.leave(`dm-${roomName}`);
      console.log(`User ${socket.userId} left DM with ${otherUserId}`);
    });

    // Send direct message
    socket.on('send-dm', async (data) => {
      try {
        const { recipientId, content } = data;

        // Validate recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          socket.emit('error', { message: 'Recipient not found' });
          return;
        }

        // Cannot send to yourself
        if (recipientId === socket.userId) {
          socket.emit('error', { message: 'Cannot send message to yourself' });
          return;
        }

        // Create message in database
        const message = await Message.create({
          senderId: socket.userId,
          recipientId,
          content: content.trim(),
          isAnonymous: false,
        });

        await message.populate('senderId', 'name username');
        await message.populate('recipientId', 'name username');

        // Create consistent room name
        const roomName = [socket.userId, recipientId].sort().join('-');

        // Broadcast to both users in the DM room
        io.to(`dm-${roomName}`).emit('new-dm', message);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Typing indicator for DMs
    socket.on('typing-dm', (data) => {
      const { recipientId, isTyping } = data;
      const roomName = [socket.userId, recipientId].sort().join('-');
      socket.to(`dm-${roomName}`).emit('user-typing-dm', {
        userId: socket.userId,
        isTyping,
      });
    });

    // ==================== NOTIFICATION EVENTS ====================

    // Mark notification as read (client can do this via REST API or socket)
    socket.on('mark-notification-read', async (notificationId) => {
      try {
        const Notification = require('../models/Notification');
        const notification = await Notification.findOne({
          _id: notificationId,
          userId: socket.userId,
        });

        if (notification) {
          notification.isRead = true;
          await notification.save();
          
          // Emit updated unread count
          const unreadCount = await Notification.getUnreadCount(socket.userId);
          socket.emit('notification-count-updated', { count: unreadCount });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // ==================== DISCONNECT ====================

    // Handle disconnect
    socket.on('disconnect', () => {
      socket.leave(`user-${socket.userId}`);
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};

module.exports = { socketAuthMiddleware, setupSocketHandlers };
