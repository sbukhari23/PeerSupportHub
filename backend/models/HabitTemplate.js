const mongoose = require('mongoose');

const habitTemplateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String, 
      required: true,
    },
    category: {
      type: String,
      enum: ['Wellness', 'Productivity', 'Learning', 'Social', 'Career'],
      required: true,
    },
    routineAnchorOptions: [String], 
    isPublic: {
      type: Boolean,
      default: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, 
    },
  },
  {
    timestamps: true,
  }
);

// enforce uniqueness only per creator + name so users can make identically-named templates
habitTemplateSchema.index({ creatorId: 1, name: 1 }, { unique: true });

const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);
module.exports = HabitTemplate;