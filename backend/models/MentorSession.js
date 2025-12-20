const mongoose = require('mongoose');

const mentorSessionSchema = mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
      index: true,
    },
    meetingLink: {
      type: String,
    },
    topic: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    menteeNotes: {
      type: String,
    },
    mentorNotes: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', null],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding sessions between mentor and mentee
mentorSessionSchema.index({ mentorId: 1, menteeId: 1 });

// Index for finding upcoming sessions
mentorSessionSchema.index({ sessionDate: 1, status: 1 });

// Virtual to check if session is upcoming
mentorSessionSchema.virtual('isUpcoming').get(function () {
  return this.sessionDate > new Date() && this.status === 'scheduled';
});

// Virtual to check if session is past
mentorSessionSchema.virtual('isPast').get(function () {
  return this.sessionDate < new Date();
});

// Static method to get mentor's upcoming sessions
mentorSessionSchema.statics.getMentorUpcomingSessions = function (mentorId) {
  return this.find({
    mentorId,
    sessionDate: { $gte: new Date() },
    status: 'scheduled',
  })
    .populate('menteeId', 'name username email')
    .sort({ sessionDate: 1 });
};

// Static method to get mentee's upcoming sessions
mentorSessionSchema.statics.getMenteeUpcomingSessions = function (menteeId) {
  return this.find({
    menteeId,
    sessionDate: { $gte: new Date() },
    status: 'scheduled',
  })
    .populate('mentorId', 'name username email')
    .sort({ sessionDate: 1 });
};

// Method to mark session as completed
mentorSessionSchema.methods.complete = function (notes) {
  this.status = 'completed';
  if (notes) {
    this.mentorNotes = notes;
  }
  return this.save();
};

// Method to cancel session
mentorSessionSchema.methods.cancel = function () {
  this.status = 'cancelled';
  return this.save();
};

const MentorSession = mongoose.model('MentorSession', mentorSessionSchema);
module.exports = MentorSession;
