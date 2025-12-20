const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
  {
    // --- AUTHENTICATION FIELDS ---
    // Changed: 'sparse: true' allows this to be null/missing for Email users
    authId: {
      type: String,
      unique: true,
      sparse: true, 
    },
    name: {
      type: String,
      required: true,
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

    // --- EMAIL VERIFICATION & PASSWORD RESET ---
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },

    // --- PROFILE FIELDS (From your Schema) ---
    username: {
      type: String,
      required: true,
      unique: true,
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
    buddies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
      },
    ],
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
// 3. Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token; // Return unhashed token to send via email
};

// 4. Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token; // Return unhashed token to send via email
};


const User = mongoose.model('User', userSchema);
module.exports = User;