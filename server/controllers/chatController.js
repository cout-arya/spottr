const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const { Match } = require('../models/Match');

// @desc    Get messages for a match
// @route   GET /api/chat/:matchId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const pageSize = 50;
    const page = Number(req.query.page) || 1;
    const matchId = req.params.matchId;

    // Verify user is part of match
    const match = await Match.findById(matchId);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }
    if (!match.users.includes(req.user._id)) {
        res.status(401);
        throw new Error('Not authorized to view this chat');
    }

    const messages = await Message.find({ matchId })
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate('senderId', 'name profile.photos');

    res.json(messages.reverse());
});

// @desc    Send message
// @route   POST /api/chat/:matchId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const matchId = req.params.matchId;

    // Verify user is part of match
    const match = await Match.findById(matchId);
    if (!match) {
        res.status(404);
        throw new Error('Match not found');
    }
    if (!match.users.includes(req.user._id)) {
        res.status(401);
        throw new Error('Not authorized to send to this chat');
    }

    const message = await Message.create({
        matchId,
        senderId: req.user._id,
        content
    });

    const fullMessage = await Message.findById(message._id).populate('senderId', 'name profile.photos');

    // Real-time Socket Emission
    const io = req.app.get('io');
    if (io) {
        io.to(matchId).emit('message received', fullMessage);
    }

    res.json(fullMessage);
});

module.exports = { getMessages, sendMessage };
