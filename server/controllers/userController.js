const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { calculateCompatibilityScore } = require('../utils/matchmaker');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profile: user.profile,
            gamification: user.gamification,
            preferences: user.preferences
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        if (req.body.profile) {
            console.log('[DEBUG] Incoming Profile Update:', JSON.stringify(req.body.profile, null, 2));

            // Safely update profile fields
            for (const key in req.body.profile) {
                user.profile[key] = req.body.profile[key];
            }

            // Explicitly ensure goals are set if present
            if (req.body.profile.goals) {
                user.profile.goals = req.body.profile.goals;
            }
        }
        if (req.body.preferences) {
            for (const key in req.body.preferences) {
                user.preferences[key] = req.body.preferences[key];
            }
        }

        // Force Mongoose to acknowledge the change to the profile object
        user.markModified('profile');
        user.markModified('preferences');

        console.log('[DEBUG] Saving User Profile. Goals:', user.profile.goals);

        // Handle specific updates if needed (e.g., location)

        // Ensure location is valid (auto-repair for broken users)
        if (!user.profile.location || !user.profile.location.coordinates || user.profile.location.coordinates.length !== 2) {
            user.profile.location = {
                type: 'Point',
                coordinates: [0, 0]
            };
        }

        try {
            console.log("Updating Profile with:", JSON.stringify(req.body.profile, null, 2));
            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profile: updatedUser.profile,
                gamification: updatedUser.gamification,
                preferences: updatedUser.preferences,
                token: req.headers.authorization.split(' ')[1] // return existing token or generate new one
            });
        } catch (error) {
            console.error("User Save Error Message:", error.message);
            if (error.errors) {
                console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
            }
            res.status(400); // Bad Request (Validation Error)
            throw new Error(error.message);
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Search all users by name or city
// @route   GET /api/users/search?q=keyword
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.q
        ? {
            $or: [
                { name: { $regex: req.query.q, $options: 'i' } },
                { 'profile.city': { $regex: req.query.q, $options: 'i' } }
            ]
        }
        : {};

    // Exclude current user from search
    // Exclude current user from search
    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
        .limit(20);

    const usersWithScore = users.map(user => {
        const score = calculateCompatibilityScore(req.user, user);
        return {
            ...user.toObject(),
            matchPercentage: score
        };
    });

    res.json(usersWithScore);
});

module.exports = { getUserProfile, updateUserProfile, searchUsers };
