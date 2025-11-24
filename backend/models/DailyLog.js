const mongoose = require('mongoose');

const dailyLogSchema = mongoose.Schema(
  {
    userHabitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserHabit',
      required: true,
      index: true, 
    },
    logDate: {
      type: Date,
      required: true,
      index: true, 
    },
    completionStatus: {
      type: String,
      enum: ['Completed', 'Failed', 'Paused'],
      required: true,
    },
    loggedAt: {
      type: Date, 
      required: true,
    },
    reflectionNote: {
      type: String,
    },
    progressScoreImpact: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
module.exports = DailyLog;