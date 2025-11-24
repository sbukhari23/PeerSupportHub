const mongoose = require('mongoose');

const feedbackMirrorSchema = mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Habit', 'Accountability', 'General'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    flaggedForModeration: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const FeedbackMirror = mongoose.model('FeedbackMirror', feedbackMirrorSchema);
module.exports = FeedbackMirror;