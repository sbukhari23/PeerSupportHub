const mongoose = require('mongoose');

const challengeParticipationSchema = mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    progress: {
      type: Number, // 0-100 percentage
      default: 0,
      min: 0,
      max: 100,
    },
    score: {
      type: Number, // Points earned in this challenge
      default: 0,
    },
    rank: {
      type: Number, // Current ranking
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed', 'abandoned'],
      default: 'active',
      index: true,
    },
    checkIns: [{
      date: {
        type: Date,
        default: Date.now,
      },
      value: Number, // Progress value for that day
      note: String,
    }],
    achievements: [{
      name: String,
      unlockedAt: {
        type: Date,
        default: Date.now,
      },
      icon: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Compound index for unique participation
challengeParticipationSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

// Index for leaderboard queries
challengeParticipationSchema.index({ challengeId: 1, score: -1 });

// Method to add check-in
challengeParticipationSchema.methods.addCheckIn = async function (value, note = '') {
  this.checkIns.push({
    date: new Date(),
    value,
    note,
  });
  
  // Update score based on check-in
  this.score += value;
  
  await this.save();
  return this;
};

// Method to update progress
challengeParticipationSchema.methods.updateProgress = async function (newProgress) {
  this.progress = Math.min(100, Math.max(0, newProgress));
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  await this.save();
  return this;
};

// Method to unlock achievement
challengeParticipationSchema.methods.unlockAchievement = async function (name, icon = '🏆') {
  // Check if already unlocked
  if (!this.achievements.some(a => a.name === name)) {
    this.achievements.push({
      name,
      icon,
      unlockedAt: new Date(),
    });
    await this.save();
  }
  return this;
};

// Static method to get user's active challenges
challengeParticipationSchema.statics.getUserActiveChallenges = async function (userId) {
  return await this.find({
    userId,
    status: 'active',
  }).populate('challengeId');
};

// Static method to calculate leaderboard
challengeParticipationSchema.statics.getLeaderboard = async function (challengeId, limit = 10) {
  return await this.find({ challengeId })
    .sort({ score: -1, progress: -1 })
    .limit(limit)
    .populate('userId', 'name username')
    .lean();
};

const ChallengeParticipation = mongoose.model('ChallengeParticipation', challengeParticipationSchema);

module.exports = ChallengeParticipation;
