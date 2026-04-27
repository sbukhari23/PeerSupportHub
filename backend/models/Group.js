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
    // Track when each member joined to filter message visibility
    memberJoinDates: [
      {
        memberId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
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

// Helper method to get member join date
groupSchema.methods.getMemberJoinDate = function(userId) {
  const memberJoin = this.memberJoinDates.find(
    (m) => m.memberId.toString() === userId.toString()
  );
  return memberJoin ? memberJoin.joinedAt : this.createdAt;
};

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;