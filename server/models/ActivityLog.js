const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['workout', 'meal', 'match', 'streak'], required: true },
    xpEarned: { type: Number, required: true },
    details: { type: String }, // e.g., "Leg Day", "Salad"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
