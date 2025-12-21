const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Log a user activity (workout, meal, etc.)
// @route   POST /api/gamification/log
// @access  Private
const logActivity = asyncHandler(async (req, res) => {
    const { type, details } = req.body;
    const userId = req.user._id;

    let xpEarned = 0;
    switch (type) {
        case 'workout':
            xpEarned = 50;
            break;
        case 'meal':
            xpEarned = 25;
            break;
        case 'match':
            xpEarned = 100;
            break;
        case 'streak':
            xpEarned = 10;
            break;
        default:
            xpEarned = 5;
    }

    // Create Log
    await ActivityLog.create({
        userId,
        type,
        xpEarned,
        details
    });

    // Update User Stats
    const user = await User.findById(userId);
    user.gamification.xp += xpEarned;

    // Level Calculation: floor(sqrt(XP / 100))
    // e.g. 100xp = lvl 1, 400xp = lvl 2, 900xp = lvl 3
    const newLevel = Math.floor(Math.sqrt(user.gamification.xp / 100)) + 1;
    if (newLevel > user.gamification.level) {
        // Level Up!
        user.gamification.level = newLevel;
        // Could add notification logic here
    }

    // Streak Logic (simplified: just check if last activity was yesterday)
    const lastActivityDate = new Date(user.gamification.lastActivity);
    const today = new Date();
    const isSameDay = lastActivityDate.toDateString() === today.toDateString();

    // If not today, check if it was yesterday for streak continuation
    if (!isSameDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActivityDate.toDateString() === yesterday.toDateString()) {
            user.gamification.streak += 1;
        } else {
            // Reset streak if gap > 1 day
            user.gamification.streak = 1;
        }
    }

    user.gamification.lastActivity = Date.now();
    await user.save();

    res.json(user.gamification);
});

// @desc    Get Leaderboard (optional)
// @route   GET /api/gamification/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
    const leaders = await User.find({})
        .sort({ 'gamification.xp': -1 })
        .limit(10)
        .select('name profile.photos gamification');

    res.json(leaders);
});

module.exports = { logActivity, getLeaderboard };
