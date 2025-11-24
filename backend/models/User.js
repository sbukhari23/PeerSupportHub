const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    // --- AUTHENTICATION FIELDS ---
    // Changed: 'sparse: true' allows this to be null/missing for Email users
    authId: {
      type: String,
      unique: true,
      sparse: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // Added: Needed for Email/Password users
    password: {
      type: String,
      // Not required: true, because Google users won't have one
    },

    // --- PROFILE FIELDS (From your Schema) ---
    username: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: false, 
    },
    userType: {
      type: String,
      enum: ['User', 'Mentor', 'Admin'],
      default: 'User',
    },
    onboardingIntent: {
      type: String,
      required: false,
    },

    // --- SETTINGS & GAMIFICATION ---
    settings: {
      language: String,
      contentPreference: {
        type: String,
        enum: ['General', 'Guided'],
        default: 'General',
      },
      reminders: Boolean,
    },
    currentProgressScore: {
      type: Number,
      default: 0,
    },

    // --- RELATIONSHIPS ---
    buddyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
    },
    pods: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group', 
      },
    ],
  },
  {
    timestamps: true,
  }
);

// --- SECURITY MIDDLEWARE ---

// 1. Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. Helper to compare passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;