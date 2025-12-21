const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const DailyLog = require('../models/DailyLog');
const UserHabit = require('../models/UserHabit');
const { objectIdValidation, validate } = require('../middleware/validationMiddleware');

// Helpers
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseHHMM = (hhmm) => {
  // hhmm expected "HH:MM"
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map((s) => parseInt(s, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const inTimeWindow = (start, end, nowDate = new Date()) => {
  if (!start || !end) return true; // no constraints
  const startMinutes = parseHHMM(start);
  const endMinutes = parseHHMM(end);
  if (startMinutes === null || endMinutes === null) return true;

  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  // Handle windows which cross midnight
  if (endMinutes >= startMinutes) {
    return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
  } else {
    // For example start 22:00 (1320), end 02:00 (120) -> check if now >= start OR now <= end
    return nowMinutes >= startMinutes || nowMinutes <= endMinutes;
  }
};

// Helper to calculate and update streak for a habit
const calculateStreakForHabit = async (habitId) => {
  let streakCount = 0;
  const today = getStartOfDay();
  let checkingDay = new Date(today);
  const maxStreakCheck = 365; // Prevent infinite loops

  for (let i = 0; i < maxStreakCheck; i++) {
    const log = await DailyLog.findOne({ 
      userHabitId: habitId, 
      logDate: checkingDay, 
      completionStatus: { $in: ['Completed', 'Paused'] } 
    });
    if (!log) break;
    streakCount++;
    checkingDay = getStartOfDay(new Date(checkingDay.getTime() - 24 * 60 * 60 * 1000));
  }

  return streakCount;
};

// POST /api/logs/:habitId  -- Log a habit as completed today
router.post(
  '/:habitId',
  protect,
  ...objectIdValidation('habitId'),
  validate,
  async (req, res) => {
  const { habitId } = req.params;
  const { completionStatus = 'Completed', reflectionNote = '' } = req.body;

  try {
    const userHabit = await UserHabit.findById(habitId);
    if (!userHabit) return res.status(404).json({ msg: 'Habit not found' });

    if (String(userHabit.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to log this habit' });
    }

    // Time window enforcement
    if (!inTimeWindow(userHabit.dailyWindowStart, userHabit.dailyWindowEnd)) {
      return res.status(400).json({ msg: 'Current time is outside the allowed daily window' });
    }

    const today = getStartOfDay();

    // Prevent duplicates for the day
    const existing = await DailyLog.findOne({ userHabitId: habitId, logDate: today });
    if (existing) return res.status(400).json({ msg: 'A log already exists for this habit today' });

    const now = new Date();
    const progressScoreImpact = completionStatus === 'Completed' ? 1 : (completionStatus === 'Failed' ? -1 : 0);

    const dailyLog = new DailyLog({
      userHabitId: habitId,
      logDate: today,
      completionStatus,
      loggedAt: now,
      reflectionNote,
      progressScoreImpact,
    });

    const savedLog = await dailyLog.save();

    // Update the UserHabit streak/compassionate pause
    if (completionStatus === 'Completed') {
      // Check for a completed or paused log yesterday to maintain streak
      const yesterday = getStartOfDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
      const yesterdayLog = await DailyLog.findOne({ 
        userHabitId: habitId, 
        logDate: yesterday, 
        completionStatus: { $in: ['Completed', 'Paused'] } 
      });

      if (yesterdayLog) {
        userHabit.streak = (userHabit.streak || 0) + 1;
      } else {
        userHabit.streak = 1; // new streak started
      }
    } else if (completionStatus === 'Failed') {
      userHabit.streak = 0;
    } else if (completionStatus === 'Paused') {
      userHabit.compassionatePauseCount = (userHabit.compassionatePauseCount || 0) + 1;
      // Streak is maintained on pause
    }

    await userHabit.save();

    res.status(201).json(savedLog);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/logs/user/:habitId  -- get all logs for a specific habit
router.get(
  '/user/:habitId',
  protect,
  ...objectIdValidation('habitId'),
  validate,
  async (req, res) => {
  const { habitId } = req.params;

  try {
    const userHabit = await UserHabit.findById(habitId);
    if (!userHabit) return res.status(404).json({ msg: 'Habit not found' });
    if (String(userHabit.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to view this habit logs' });
    }

    const logs = await DailyLog.find({ userHabitId: habitId }).sort({ logDate: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/logs/:logId -- update a log (e.g., add reflection note). No completion status changes for now
router.put(
  '/:logId',
  protect,
  ...objectIdValidation('logId'),
  validate,
  async (req, res) => {
  const { logId } = req.params;
  const { reflectionNote } = req.body;

  try {
    const log = await DailyLog.findById(logId).populate('userHabitId');
    if (!log) return res.status(404).json({ msg: 'Log not found' });

    if (String(log.userHabitId.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to update this log' });
    }

    if (reflectionNote !== undefined) log.reflectionNote = reflectionNote;

    const updated = await log.save();

    // Recalculate streak to keep history consistent
    const habitId = log.userHabitId._id;
    const newStreak = await calculateStreakForHabit(habitId);
    const userHabit = await UserHabit.findById(habitId);
    if (userHabit && userHabit.streak !== newStreak) {
      userHabit.streak = newStreak;
      await userHabit.save();
    }

    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/logs/today -- Get all of today's logs for the current user
router.get('/today', protect, async (req, res) => {
  try {
    const today = getStartOfDay();
    
    // Get all user's habits
    const userHabits = await UserHabit.find({ userId: req.user._id });
    const habitIds = userHabits.map(h => h._id);
    
    // Get today's logs for those habits
    const todayLogs = await DailyLog.find({
      userHabitId: { $in: habitIds },
      logDate: today,
    });
    
    res.json(todayLogs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/logs/weekly -- Get logs for the current week (Mon-Sun) for the current user
router.get('/weekly', protect, async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Monday)
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = getStartOfDay(new Date(today.getTime() - daysFromMonday * 24 * 60 * 60 * 1000));
    
    // Get all user's habits
    const userHabits = await UserHabit.find({ userId: req.user._id });
    const habitIds = userHabits.map(h => h._id);
    const totalHabits = habitIds.length;
    
    // Get logs for this week
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekLogs = await DailyLog.find({
      userHabitId: { $in: habitIds },
      logDate: { $gte: startOfWeek, $lt: endOfWeek },
    });
    
    // Build daily progress for each day of the week
    const weeklyProgress = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = getStartOfDay(new Date(startOfWeek.getTime() + i * 24 * 60 * 60 * 1000));
      const dayLogs = weekLogs.filter(log => {
        const logDate = getStartOfDay(log.logDate);
        return logDate.getTime() === dayDate.getTime();
      });
      
      const completedCount = dayLogs.filter(log => log.completionStatus === 'Completed').length;
      const pausedCount = dayLogs.filter(log => log.completionStatus === 'Paused').length;
      
      const todayStart = getStartOfDay();
      const isToday = dayDate.getTime() === todayStart.getTime();
      const isFuture = dayDate.getTime() > todayStart.getTime();
      
      weeklyProgress.push({
        day: dayNames[i],
        date: dayDate.toISOString(),
        completed: completedCount,
        paused: pausedCount,
        total: totalHabits,
        percentage: totalHabits > 0 ? Math.round(((completedCount + pausedCount) / totalHabits) * 100) : 0,
        isToday,
        isFuture,
      });
    }
    
    res.json(weeklyProgress);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/logs/streak/:habitId -- Calculate current streak for this habit
router.get(
  '/streak/:habitId',
  protect,
  ...objectIdValidation('habitId'),
  validate,
  async (req, res) => {
  const { habitId } = req.params;
  try {
    const userHabit = await UserHabit.findById(habitId);
    if (!userHabit) return res.status(404).json({ msg: 'Habit not found' });
    if (String(userHabit.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to view this streak' });
    }

    // Calculate streak using helper function
    const streakCount = await calculateStreakForHabit(habitId);

    // Keep in sync with stored streak
    if (userHabit.streak !== streakCount) {
      userHabit.streak = streakCount;
      await userHabit.save();
    }

    res.json({ streak: streakCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/logs/:logId -- Delete a log (undo today's submission)
router.delete(
  '/:logId',
  protect,
  ...objectIdValidation('logId'),
  validate,
  async (req, res) => {
  const { logId } = req.params;

  try {
    const log = await DailyLog.findById(logId).populate('userHabitId');
    if (!log) return res.status(404).json({ msg: 'Log not found' });

    // Check authorization
    if (String(log.userHabitId.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to delete this log' });
    }

    // Optional: Only allow deletion of today's log (business rule)
    const today = getStartOfDay();
    const logDate = getStartOfDay(log.logDate);
    if (logDate.getTime() !== today.getTime()) {
      return res.status(400).json({ msg: 'Can only delete today\'s log' });
    }

    const habitId = log.userHabitId._id;

    // Delete the log
    await log.deleteOne();

    // Recalculate streak after deletion
    const newStreak = await calculateStreakForHabit(habitId);
    const userHabit = await UserHabit.findById(habitId);
    if (userHabit) {
      userHabit.streak = newStreak;
      
      // If the deleted log was paused, decrement compassionate pause count
      if (log.completionStatus === 'Paused' && userHabit.compassionatePauseCount > 0) {
        userHabit.compassionatePauseCount -= 1;
      }
      
      await userHabit.save();
    }

    res.json({ msg: 'Log deleted successfully', newStreak });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
