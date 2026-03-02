const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    readAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
