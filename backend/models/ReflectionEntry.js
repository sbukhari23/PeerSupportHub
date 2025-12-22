const mongoose = require ('mongoose');

const reflectionEntrySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: ['GratitudeLog', 'WeeklyReview', 'MoodEnergyLog'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
    },
    moodRating: {
      type: Number, 
      min: 1,
      max: 5,
    },
    energyState: {
      type: String,
      enum: ['High', 'Low', 'Neutral'],
    },
  },
  {
    timestamps: true,
  }
);

const ReflectionEntry = mongoose.model('ReflectionEntry', reflectionEntrySchema);
module.exports = ReflectionEntry;