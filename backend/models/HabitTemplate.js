const mongoose = require('mongoose');

const habitTemplateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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

const HabitTemplate = mongoose.model('HabitTemplate', habitTemplateSchema);
module.exports = HabitTemplate;