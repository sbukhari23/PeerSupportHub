const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    authId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
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

const User = mongoose.model('User', userSchema);
module.exports = User;