const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { Match } = require('../models/Match');

// @desc    Log a user activity (workout, meal, etc.)
// @route   POST /api/gamification/log
// @access  Private
const logActivity = asyncHandler(async (req, res) => {
    const { type, details, xpOverride, data } = req.body;
    const userId = req.user._id;

    let xpEarned = xpOverride || 0;

    if (!xpEarned) {
        switch (type) {
            case 'workout': xpEarned = 50; break;
            case 'meal': xpEarned = 25; break;
            case 'match': xpEarned = 100; break;
            case 'streak': xpEarned = 10; break;
            default: xpEarned = 5;
        }
    }

    // Create Log
    await ActivityLog.create({
        userId,
        type,
        xpEarned,
        details: typeof details === 'object' ? JSON.stringify(details) : details
    });

    // Update User Stats
    const user = await User.findById(userId);
    user.gamification.xp += xpEarned;

    // Level Calculation: floor(sqrt(XP / 100)) + 1
    const newLevel = Math.floor(Math.sqrt(user.gamification.xp / 100)) + 1;
    if (newLevel > user.gamification.level) {
        user.gamification.level = newLevel;
    }

    // Streak Logic
    const lastActivityDate = new Date(user.gamification.lastActivity);
    const today = new Date();
    const isSameDay = lastActivityDate.toDateString() === today.toDateString();

    if (!isSameDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActivityDate.toDateString() === yesterday.toDateString()) {
            user.gamification.streak += 1;
        } else {
            // Only reset if it wasn't a fresh account (lastActivity 0)
            if (user.gamification.lastActivity > 0) {
                user.gamification.streak = 1;
            } else {
                user.gamification.streak = 1;
            }
        }
    }

    // BADGE CHECKING SYSTEM
    const currentBadges = user.gamification.badges || [];
    const newBadges = [];

    // Badge: Streak Master (7 Day Streak)
    if (user.gamification.streak >= 7 && !currentBadges.includes('Streak Master 🔥')) {
        newBadges.push('Streak Master 🔥');
    }

    // Badge: Dedicated (Level 5)
    if (user.gamification.level >= 5 && !currentBadges.includes('Dedicated 🛡️')) {
        newBadges.push('Dedicated 🛡️');
    }

    // Badge: The Machine (Level 10)
    if (user.gamification.level >= 10 && !currentBadges.includes('The Machine 🤖')) {
        newBadges.push('The Machine 🤖');
    }

    // Badge: Early Bird (Logged between 4AM and 8AM)
    const hour = today.getHours();
    if (hour >= 4 && hour <= 8 && !currentBadges.includes('Early Bird 🌅')) {
        newBadges.push('Early Bird 🌅');
    }

    if (newBadges.length > 0) {
        user.gamification.badges = [...currentBadges, ...newBadges];
    }

    user.gamification.lastActivity = Date.now();
    await user.save();

    res.json({ ...user.gamification, newBadges });
});

// @desc    Get Leaderboard (Friends/Matches Only)
// @route   GET /api/gamification/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
    // 1. Find all matches where the current user is a participant
    const matches = await Match.find({ users: req.user._id });

    // 2. Extract IDs of matched users
    const friendIds = matches.reduce((acc, match) => {
        const friendId = match.users.find(id => id.toString() !== req.user._id.toString());
        if (friendId) acc.push(friendId);
        return acc;
    }, []);

    // 3. Include Current User in the list
    const leaderboardIds = [req.user._id, ...friendIds];

    // 4. Fetch Users sorted by XP
    const leaders = await User.find({ _id: { $in: leaderboardIds } })
        .sort({ 'gamification.xp': -1 })
        .limit(10)
        .select('name profile.photos gamification');

    res.json(leaders);
});

module.exports = { logActivity, getLeaderboard };
