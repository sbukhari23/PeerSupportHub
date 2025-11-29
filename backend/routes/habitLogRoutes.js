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

// POST /api/logs/:habitId  -- Log a habit as completed today
router.post('/:habitId', protect, objectIdValidation, validate, async (req, res) => {
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
router.get('/user/:habitId', protect, objectIdValidation, validate, async (req, res) => {
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
router.put('/:logId', protect, objectIdValidation, validate, async (req, res) => {
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
    res.json(updated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/logs/streak/:habitId -- Calculate current streak for this habit
router.get('/streak/:habitId', protect, objectIdValidation, validate, async (req, res) => {
  const { habitId } = req.params;
  try {
    const userHabit = await UserHabit.findById(habitId);
    if (!userHabit) return res.status(404).json({ msg: 'Habit not found' });
    if (String(userHabit.userId) !== String(req.user._id)) {
      return res.status(403).json({ msg: 'Not authorized to view this streak' });
    }

    // Calculate streak by scanning consecutive completed/paused logs up to today
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

module.exports = router;
