const mongoose = require('mongoose');

const mentorProfileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    bio: {
      type: String,
      required: true,
    },
    expertise: [String],
    isVerified: {
      type: Boolean,
      default: false,
    },
    oneOnOneLink: {
      type: String,
    },
    monthlyQASchedule: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
module.exports = MentorProfile;