const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    },
    type: {
        type: String,
        enum: ['Story', 'Post'],
        default: 'Post'
    },
    mediaUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        trim: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    tags: [String],
    isRegional: {
        type: Boolean,
        default: false // For Mithilanchal trending highlights
    }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
