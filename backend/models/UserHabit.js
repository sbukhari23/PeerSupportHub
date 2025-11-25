const mongoose = require('mongoose');

const userHabitSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, 
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HabitTemplate',
      required: true,
    },
    userIntention: {
      type: String,
      required: true,
    },
    dailyWindowStart: {
      type: String, 
      required: true,
    },
    dailyWindowEnd: {
      type: String, 
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    streak: {
      type: Number,
      default: 0,
    },
    compassionatePauseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'startedAt', updatedAt: false } 
  }
);

const UserHabit = mongoose.model('UserHabit', userHabitSchema);
module.exports = UserHabit;





farhsfdjk jvikj afhd sncmzfhsdvjxcacgkzdh gjhzhx jkfmnhsvzdugjh zjfhhhhhhhhhhhqty8baennnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnyf HVEUFKJADNFGUASDJHHNACFUAWRUEYCBYFTY[C 8FUASDTFCBNXA<UCDBPADYXBDSCVNRFGRSEUIGNXHC A DVIONSYFNCPFBVUNZ FST VGUFZYYE7WBUTFVXDG U]