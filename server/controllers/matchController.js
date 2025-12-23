const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { Interaction, Match } = require('../models/Match');
const { calculateCompatibilityScore } = require('../utils/matchmaker');

// @desc    Get recommendations (potential matches)
// @route   GET /api/matches/recommendations
// @access  Private
const getRecommendations = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id);

    // Get IDs of users already interacted with
    const interactedIds = await Interaction.find({ actorId: currentUser._id }).distinct('targetId');
    interactedIds.push(currentUser._id); // Exclude self

    // Find potential candidates
    // Filter by same city and exclude interacted users
    const filter = {
        _id: { $nin: interactedIds }
    };

    if (currentUser.profile && currentUser.profile.city) {
        // Case-insensitive match for city
        filter['profile.city'] = { $regex: new RegExp(`^${currentUser.profile.city}$`, 'i') };
    }

    let candidates = await User.find(filter).limit(50);

    // Calculate scores
    const scoredCandidates = candidates.map(user => {
        const score = calculateCompatibilityScore(currentUser, user);
        return { user, score };
    });

    // Sort by score desc
    scoredCandidates.sort((a, b) => b.score - a.score);

    res.json(scoredCandidates);
});

// @desc    Swipe (Like/Pass)
// @route   POST /api/matches/swipe
// @access  Private
// @desc    Swipe (Like/Pass)
// @route   POST /api/matches/swipe
// @access  Private
const swipe = asyncHandler(async (req, res) => {
    const { targetId, type } = req.body;
    const actorId = req.user._id;

    if (!targetId || !type) {
        res.status(400);
        throw new Error('Missing targetId or type');
    }

    // Record interaction
    await Interaction.findOneAndUpdate(
        { actorId, targetId },
        { type },
        { upsert: true, new: true }
    );

    let isMatch = false;

    if (type === 'like') {
        const io = req.app.get('io');

        // Check for mutual like
        const mutualLike = await Interaction.findOne({
            actorId: targetId,
            targetId: actorId,
            type: 'like'
        });

        if (mutualLike) {
            // Check if match already exists to prevent duplicates
            const existingMatch = await Match.findOne({
                users: { $all: [actorId, targetId] }
            });

            if (!existingMatch) {
                isMatch = true;
                const newMatch = await Match.create({
                    users: [actorId, targetId]
                });

                // Notify both users
                const actor = await User.findById(actorId).select('name profile.photos');
                const target = await User.findById(targetId).select('name profile.photos');

                if (io) {
                    io.to(actorId.toString()).emit('match found', {
                        matchId: newMatch._id,
                        friend: { _id: target._id, name: target.name, photo: target.profile.photos?.[0] }
                    });
                    io.to(targetId.toString()).emit('match found', {
                        matchId: newMatch._id,
                        friend: { _id: actor._id, name: actor.name, photo: actor.profile.photos?.[0] }
                    });
                }
            }
        } else {
            // One-way like notification
            if (io) {
                const actor = await User.findById(actorId).select('name');
                io.to(targetId.toString()).emit('like received', { admirerName: actor.name });
            }
        }
    }

    res.json({ success: true, isMatch });
});

// @desc    Get All Matches
// @route   GET /api/matches
// @access  Private
const getMatches = asyncHandler(async (req, res) => {
    const matches = await Match.find({ users: req.user._id })
        .populate('users', 'name profile.photos profile.city'); // Populate basic info

    // Filter out self from the users array in response if wanted, or frontend handles it
    res.json(matches);
});

module.exports = { getRecommendations, swipe, getMatches };
