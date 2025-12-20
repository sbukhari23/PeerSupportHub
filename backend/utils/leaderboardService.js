const ChallengeParticipation = require('../models/ChallengeParticipation');
const User = require('../models/User');

/**
 * Leaderboard Service
 * Calculate rankings and manage leaderboards
 */

/**
 * Calculate and update rankings for a challenge
 * @param {String} challengeId - Challenge ID
 */
const calculateChallengeRankings = async (challengeId) => {
  try {
    // Get all participants sorted by score
    const participants = await ChallengeParticipation.find({ challengeId })
      .sort({ score: -1, progress: -1, updatedAt: 1 })
      .lean();

    // Update ranks
    const updates = participants.map((participant, index) => ({
      updateOne: {
        filter: { _id: participant._id },
        update: { rank: index + 1 },
      },
    }));

    if (updates.length > 0) {
      await ChallengeParticipation.bulkWrite(updates);
    }

    return participants;
  } catch (error) {
    console.error('Error calculating challenge rankings:', error);
    throw error;
  }
};

/**
 * Get challenge leaderboard
 * @param {String} challengeId - Challenge ID
 * @param {Number} limit - Number of entries to return
 */
const getChallengeLeaderboard = async (challengeId, limit = 10) => {
  try {
    const leaderboard = await ChallengeParticipation.find({ challengeId })
      .sort({ score: -1, progress: -1 })
      .limit(limit)
      .populate('userId', 'name username currentProgressScore')
      .lean();

    return leaderboard.map((entry, index) => ({
      rank: entry.rank || index + 1,
      user: entry.userId,
      score: entry.score,
      progress: entry.progress,
      status: entry.status,
      checkInsCount: entry.checkIns?.length || 0,
      achievements: entry.achievements || [],
    }));
  } catch (error) {
    console.error('Error getting challenge leaderboard:', error);
    throw error;
  }
};

/**
 * Get global leaderboard across all challenges
 * @param {String} period - 'weekly', 'monthly', 'all-time'
 * @param {Number} limit - Number of entries
 */
const getGlobalLeaderboard = async (period = 'all-time', limit = 10) => {
  try {
    let dateFilter = {};

    if (period === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    } else if (period === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: oneMonthAgo } };
    }

    // Aggregate total scores per user
    const leaderboard = await ChallengeParticipation.aggregate([
      { $match: { status: { $in: ['active', 'completed'] }, ...dateFilter } },
      {
        $group: {
          _id: '$userId',
          totalScore: { $sum: '$score' },
          challengesCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          challengesActive: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
        },
      },
      { $sort: { totalScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          rank: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            username: '$user.username',
            currentProgressScore: '$user.currentProgressScore',
          },
          totalScore: 1,
          challengesCompleted: 1,
          challengesActive: 1,
        },
      },
    ]);

    // Add ranking
    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    throw error;
  }
};

/**
 * Update user's overall progress score
 * @param {String} userId - User ID
 * @param {Number} points - Points to add
 */
const updateUserScore = async (userId, points) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.currentProgressScore = (user.currentProgressScore || 0) + points;
      await user.save();
      return user.currentProgressScore;
    }
    return 0;
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
};

/**
 * Get user's rank in a specific challenge
 * @param {String} challengeId - Challenge ID
 * @param {String} userId - User ID
 */
const getUserRankInChallenge = async (challengeId, userId) => {
  try {
    const participation = await ChallengeParticipation.findOne({
      challengeId,
      userId,
    });

    if (!participation) {
      return null;
    }

    // Count how many have higher score
    const higherScoreCount = await ChallengeParticipation.countDocuments({
      challengeId,
      $or: [
        { score: { $gt: participation.score } },
        {
          score: participation.score,
          progress: { $gt: participation.progress },
        },
      ],
    });

    return {
      rank: higherScoreCount + 1,
      score: participation.score,
      progress: participation.progress,
      status: participation.status,
    };
  } catch (error) {
    console.error('Error getting user rank:', error);
    throw error;
  }
};

/**
 * Get trending challenges (most participants recently)
 * @param {Number} days - Look back days
 * @param {Number} limit - Number of results
 */
const getTrendingChallenges = async (days = 7, limit = 5) => {
  try {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - days);

    const trending = await ChallengeParticipation.aggregate([
      { $match: { createdAt: { $gte: lookbackDate } } },
      {
        $group: {
          _id: '$challengeId',
          participantCount: { $sum: 1 },
        },
      },
      { $sort: { participantCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'challenges',
          localField: '_id',
          foreignField: '_id',
          as: 'challenge',
        },
      },
      { $unwind: '$challenge' },
      {
        $project: {
          challenge: 1,
          participantCount: 1,
        },
      },
    ]);

    return trending;
  } catch (error) {
    console.error('Error getting trending challenges:', error);
    throw error;
  }
};

module.exports = {
  calculateChallengeRankings,
  getChallengeLeaderboard,
  getGlobalLeaderboard,
  updateUserScore,
  getUserRankInChallenge,
  getTrendingChallenges,
};
