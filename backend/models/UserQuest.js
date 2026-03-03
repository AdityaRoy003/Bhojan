const mongoose = require('mongoose');

const userQuestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quest: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true },
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    rewarded: { type: Boolean, default: false },
    progressData: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { cuisines: ['Pizza', 'Biryani'] }
}, { timestamps: true });

userQuestSchema.index({ user: 1, quest: 1 }, { unique: true });

module.exports = mongoose.model('UserQuest', userQuestSchema);
