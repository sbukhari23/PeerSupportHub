const mongoose = require('mongoose');

const groupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Pod', 'FocusedSpace', 'AnonymousVent'], 
      default: 'FocusedSpace',
    },
    topicFocus: {
      type: String,
    },
    chatChannelId: {
      type: String, 
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;