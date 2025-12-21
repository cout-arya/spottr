const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'pass'], required: true },
}, { timestamps: true });

InteractionSchema.index({ actorId: 1, targetId: 1 }, { unique: true });

const MatchSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // We can add meta info or just rely on existence
}, { timestamps: true });

module.exports = {
    Interaction: mongoose.model('Interaction', InteractionSchema),
    Match: mongoose.model('Match', MatchSchema)
};
