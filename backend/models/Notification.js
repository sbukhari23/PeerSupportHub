const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'habit_reminder',
        'buddy_request',
        'buddy_accepted',
        'message',
        'group_invite',
        'group_message',
        'mentor_session',
        'challenge_invite',
        'challenge_complete',
        'streak_milestone',
        'system'
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String, // URL to navigate to when notification is clicked
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data for the notification
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    icon: {
      type: String, // Icon name or emoji for the notification
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ userId, isRead: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
