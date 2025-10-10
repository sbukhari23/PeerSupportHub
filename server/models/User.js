/**
 * User Model
 * Week 12: Databases with MongoDB
 * Following MIT 6.102 principles: Abstract Data Types, Specifications
 */

const mongoose = require('mongoose');
const validator = require('validator');

/**
 * User Schema Definition
 * Rep Invariant:
 * - email must be unique and valid format
 * - username must be unique and 3-20 characters
 * - password must be hashed (never store plaintext)
 * - createdAt and updatedAt are automatically managed
 */
const userSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },

  // Profile information
  profile: {
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          return age >= 13 && age <= 120; // Age restrictions
        },
        message: 'Age must be between 13 and 120 years'
      }
    },
    
    avatar: {
      type: String,
      validate: [validator.isURL, 'Avatar must be a valid URL']
    },
    
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    
    goals: [{
      type: String,
      maxlength: [200, 'Goal cannot exceed 200 characters']
    }],
    
    interests: [{
      type: String,
      maxlength: [50, 'Interest cannot exceed 50 characters']
    }],
    
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Application settings
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      daily: { type: Boolean, default: true },
      weekly: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true }
    },
    
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'friends'
      },
      habitVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'friends'
      },
      allowPeerRequests: { type: Boolean, default: true },
      allowMentorRequests: { type: Boolean, default: true }
    },
    
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    
    language: {
      type: String,
      default: 'en'
    }
  },

  // Peer support data
  peerConnections: {
    buddies: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      connectedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['active', 'paused', 'ended'],
        default: 'active'
      }
    }],
    
    mentors: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      connectedAt: { type: Date, default: Date.now },
      specialties: [String],
      status: {
        type: String,
        enum: ['active', 'paused', 'ended'],
        default: 'active'
      }
    }],
    
    mentees: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      connectedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['active', 'paused', 'ended'],
        default: 'active'
      }
    }],
    
    groups: [{
      group: { type: mongoose.Schema.Types.ObjectId, ref: 'PeerGroup' },
      joinedAt: { type: Date, default: Date.now },
      role: {
        type: String,
        enum: ['member', 'moderator', 'admin'],
        default: 'member'
      }
    }]
  },

  // Progress tracking
  stats: {
    totalHabits: { type: Number, default: 0 },
    completedHabits: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
      name: String,
      description: String,
      earnedAt: { type: Date, default: Date.now },
      icon: String
    }]
  },

  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  role: {
    type: String,
    enum: ['user', 'mentor', 'moderator', 'admin'],
    default: 'user'
  },
  
  verificationStatus: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false }
  }

}, {
  timestamps: true, // Automatically add createdAt and updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance (MongoDB best practices)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'profile.fullName': 'text', 'username': 'text' }); // Text search
userSchema.index({ createdAt: -1 }); // Sort by creation date
userSchema.index({ lastLogin: -1 }); // Sort by last login
userSchema.index({ 'stats.totalPoints': -1 }); // Leaderboard queries

// Virtual properties
userSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.profile.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.profile.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.profile.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

userSchema.virtual('activeBuddiesCount').get(function() {
  return this.peerConnections.buddies.filter(buddy => buddy.status === 'active').length;
});

userSchema.virtual('activeMentorsCount').get(function() {
  return this.peerConnections.mentors.filter(mentor => mentor.status === 'active').length;
});

// Instance methods
userSchema.methods.addBuddy = function(buddyId) {
  const existingBuddy = this.peerConnections.buddies.find(
    buddy => buddy.user.toString() === buddyId.toString()
  );
  
  if (!existingBuddy) {
    this.peerConnections.buddies.push({ user: buddyId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

userSchema.methods.removeBuddy = function(buddyId) {
  this.peerConnections.buddies = this.peerConnections.buddies.filter(
    buddy => buddy.user.toString() !== buddyId.toString()
  );
  return this.save();
};

userSchema.methods.updateStats = function(statUpdates) {
  Object.assign(this.stats, statUpdates);
  
  // Calculate level based on total points
  const pointsPerLevel = 1000;
  this.stats.level = Math.floor(this.stats.totalPoints / pointsPerLevel) + 1;
  
  return this.save();
};

userSchema.methods.earnBadge = function(badgeData) {
  const existingBadge = this.stats.badges.find(badge => badge.name === badgeData.name);
  
  if (!existingBadge) {
    this.stats.badges.push({
      ...badgeData,
      earnedAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.searchUsers = function(query, options = {}) {
  const { limit = 20, skip = 0, sortBy = 'createdAt' } = options;
  
  return this.find({
    $or: [
      { 'profile.fullName': { $regex: query, $options: 'i' } },
      { username: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  })
  .select('-password')
  .sort({ [sortBy]: -1 })
  .limit(limit)
  .skip(skip);
};

userSchema.statics.getLeaderboard = function(options = {}) {
  const { limit = 10, timeframe = 'all' } = options;
  
  let matchStage = { isActive: true };
  
  if (timeframe !== 'all') {
    const date = new Date();
    if (timeframe === 'week') {
      date.setDate(date.getDate() - 7);
    } else if (timeframe === 'month') {
      date.setMonth(date.getMonth() - 1);
    }
    matchStage.createdAt = { $gte: date };
  }
  
  return this.find(matchStage)
    .select('username profile.fullName stats.totalPoints stats.level stats.currentStreak')
    .sort({ 'stats.totalPoints': -1, 'stats.currentStreak': -1 })
    .limit(limit);
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update stats counters
  if (this.isModified('stats')) {
    // Ensure stats are within reasonable bounds
    this.stats.totalPoints = Math.max(0, this.stats.totalPoints);
    this.stats.currentStreak = Math.max(0, this.stats.currentStreak);
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
  }
  
  next();
});

// Create and export the model
const User = mongoose.model('User', userSchema);

module.exports = User;