const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000, // Limit message length
    },
    images: [
      {
        type: String, // Store image paths/URLs
      },
    ],
    isAnonymous: {
      type: Boolean,
      default: false, // For AnonymousVent groups
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String, // '👍', '❤️', etc.
      },
    ],
    flaggedForModeration: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Validation: Must have either groupId or recipientId
messageSchema.pre('validate', function (next) {
  if (!this.groupId && !this.recipientId) {
    next(new Error('Message must have either groupId or recipientId'));
  } else if (this.groupId && this.recipientId) {
    next(new Error('Message cannot have both groupId and recipientId'));
  } else {
    next();
  }
});

// Index for efficient queries
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, senderId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
