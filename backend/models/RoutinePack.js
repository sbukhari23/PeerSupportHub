const mongoose = require('mongoose');

const routinePackSchema = mongoose.Schema(
  {
    packName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    habitTemplates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HabitTemplate',
      },
    ],
    isOfficial: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RoutinePack = mongoose.model('RoutinePack', routinePackSchema);
module.exports = RoutinePack;