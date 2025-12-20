const mongoose = require('mongoose');

const challengeSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['habit_streak', 'group_participation', 'early_riser', 'digital_detox', 'meditation', 'custom'],
      required: true,
    },
    duration: {
      type: Number, // in days
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    maxParticipants: {
      type: Number,
      default: null, // null means unlimited
    },
    rules: {
      targetHabitId: mongoose.Schema.Types.ObjectId, // For habit-specific challenges
      targetValue: Number, // e.g., 7 days streak, 5 group posts
      targetMetric: String, // 'streak', 'count', 'time', etc.
    },
    rewards: {
      points: {
        type: Number,
        default: 0,
      },
      badge: String,
      description: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['wellness', 'productivity', 'social', 'spiritual', 'learning'],
    },
    imageUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
challengeSchema.index({ isActive: 1, startDate: 1 });
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ createdBy: 1 });

// Virtual for participant count
challengeSchema.virtual('participantCount').get(function () {
  return this.participants.length;
});

// Virtual for checking if challenge is ongoing
challengeSchema.virtual('isOngoing').get(function () {
  const now = new Date();
  return this.startDate <= now && now <= this.endDate && this.isActive;
});

// Virtual for checking if challenge has ended
challengeSchema.virtual('hasEnded').get(function () {
  return new Date() > this.endDate;
});

// Method to check if user can join
challengeSchema.methods.canUserJoin = function (userId) {
  // Check if already joined
  if (this.participants.some(p => p.toString() === userId.toString())) {
    return { canJoin: false, reason: 'Already joined this challenge' };
  }

  // Check if max participants reached
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
    return { canJoin: false, reason: 'Challenge is full' };
  }

  // Check if challenge has started
  if (new Date() > this.endDate) {
    return { canJoin: false, reason: 'Challenge has ended' };
  }

  // Check if challenge is active
  if (!this.isActive) {
    return { canJoin: false, reason: 'Challenge is not active' };
  }

  return { canJoin: true };
};

// Static method to get active challenges
challengeSchema.statics.getActiveChallenges = async function (filters = {}) {
  return await this.find({
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    ...filters,
  }).populate('createdBy', 'name username');
};

// Enable virtuals in JSON
challengeSchema.set('toJSON', { virtuals: true });
challengeSchema.set('toObject', { virtuals: true });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
