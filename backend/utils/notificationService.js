const Notification = require('../models/Notification');

/**
 * Notification Service
 * Helper functions for creating and sending notifications
 */

/**
 * Create and optionally emit notification via Socket.IO
 * @param {Object} io - Socket.IO instance (optional)
 * @param {String} userId - Recipient user ID
 * @param {Object} notificationData - Notification details
 * @returns {Object} Created notification
 */
const createNotification = async (io, userId, notificationData) => {
  try {
    const notification = await Notification.create({
      userId,
      ...notificationData,
    });

    // Populate user details if needed
    await notification.populate('userId', 'name username');

    // Emit via Socket.IO if instance provided
    if (io) {
      io.to(`user-${userId}`).emit('new-notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send habit reminder notification
 */
const sendHabitReminder = async (io, userId, habitData) => {
  return await createNotification(io, userId, {
    type: 'habit_reminder',
    title: '⏰ Habit Reminder',
    message: `Time to complete your habit: ${habitData.title}`,
    link: `habits`,
    icon: '⏰',
    data: { habitId: habitData._id },
  });
};

/**
 * Send buddy request notification
 */
const sendBuddyRequestNotification = async (io, recipientId, requesterId, requesterName) => {
  return await createNotification(io, recipientId, {
    type: 'buddy_request',
    title: '🤝 New Buddy Request',
    message: `${requesterName} wants to be your accountability buddy`,
    link: `buddies`,
    icon: '🤝',
    data: { requesterId },
  });
};

/**
 * Send buddy request accepted notification
 */
const sendBuddyAcceptedNotification = async (io, userId, accepterName) => {
  return await createNotification(io, userId, {
    type: 'buddy_accepted',
    title: '✅ Buddy Request Accepted',
    message: `${accepterName} accepted your buddy request!`,
    link: `buddies`,
    icon: '✅',
  });
};

/**
 * Send new message notification
 */
const sendMessageNotification = async (io, recipientId, senderName, messagePreview, senderId = null) => {
  return await createNotification(io, recipientId, {
    type: 'message',
    title: `💬 New Message from ${senderName}`,
    message: messagePreview,
    link: senderId ? `messages-${senderId}` : '/messages',
    relatedId: senderId,
    icon: '💬',
  });
};

/**
 * Send group message notification
 */
const sendGroupMessageNotification = async (io, userId, groupName, senderName, messagePreview, groupId = null) => {
  return await createNotification(io, userId, {
    type: 'group_message',
    title: `💬 New Message in ${groupName}`,
    message: `${senderName}: ${messagePreview}`,
    link: groupId ? `group-chat-${groupId}` : '/groups',
    relatedId: groupId,
    icon: '💬',
  });
};

/**
 * Send group invite notification
 */
const sendGroupInviteNotification = async (io, userId, groupName, inviterName) => {
  return await createNotification(io, userId, {
    type: 'group_invite',
    title: '👥 Group Invitation',
    message: `${inviterName} invited you to join ${groupName}`,
    link: `/groups`,
    icon: '👥',
  });
};

/**
 * Send mentor session notification
 */
const sendMentorSessionNotification = async (io, userId, sessionData) => {
  return await createNotification(io, userId, {
    type: 'mentor_session',
    title: '🎓 Mentor Session Scheduled',
    message: `Your mentor session is scheduled for ${new Date(sessionData.scheduledAt).toLocaleString()}`,
    link: `/mentors/sessions/${sessionData._id}`,
    icon: '🎓',
    data: { sessionId: sessionData._id },
  });
};

/**
 * Send challenge invite notification
 */
const sendChallengeInviteNotification = async (io, userId, challengeName) => {
  return await createNotification(io, userId, {
    type: 'challenge_invite',
    title: '🏆 Challenge Invitation',
    message: `You've been invited to join the "${challengeName}" challenge`,
    link: `/challenges`,
    icon: '🏆',
  });
};

/**
 * Send challenge completion notification
 */
const sendChallengeCompleteNotification = async (io, userId, challengeName, rank) => {
  return await createNotification(io, userId, {
    type: 'challenge_complete',
    title: '🎉 Challenge Completed!',
    message: `Congratulations! You completed "${challengeName}" and ranked #${rank}`,
    link: `/challenges`,
    icon: '🎉',
  });
};

/**
 * Send streak milestone notification
 */
const sendStreakMilestoneNotification = async (io, userId, habitName, streakDays) => {
  return await createNotification(io, userId, {
    type: 'streak_milestone',
    title: '🔥 Streak Milestone!',
    message: `Amazing! You've maintained a ${streakDays}-day streak for ${habitName}`,
    link: `/dashboard/habits`,
    icon: '🔥',
  });
};

/**
 * Send mentor application approved notification
 */
const sendMentorApprovedNotification = async (io, userId) => {
  return await createNotification(io, userId, {
    type: 'mentor_application_approved',
    title: '🎉 Mentor Application Approved!',
    message: 'Congratulations! Your mentor application has been approved. You can now receive mentee requests.',
    link: '/mentors',
    icon: '🎉',
  });
};

/**
 * Send mentor application rejected notification
 */
const sendMentorRejectedNotification = async (io, userId, reason = '') => {
  return await createNotification(io, userId, {
    type: 'mentor_application_rejected',
    title: '❌ Mentor Application Update',
    message: reason ? `Your mentor application was not approved. Reason: ${reason}` : 'Your mentor application was not approved at this time. You may reapply in the future.',
    link: '/mentors',
    icon: '❌',
  });
};

/**
 * Send system notification
 */
const sendSystemNotification = async (io, userId, title, message, link = null) => {
  return await createNotification(io, userId, {
    type: 'system',
    title,
    message,
    link,
    icon: '📢',
  });
};

module.exports = {
  createNotification,
  sendHabitReminder,
  sendBuddyRequestNotification,
  sendBuddyAcceptedNotification,
  sendMessageNotification,
  sendGroupMessageNotification,
  sendGroupInviteNotification,
  sendMentorSessionNotification,
  sendChallengeInviteNotification,
  sendChallengeCompleteNotification,
  sendStreakMilestoneNotification,
  sendMentorApprovedNotification,
  sendMentorRejectedNotification,
  sendSystemNotification,
};
