const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    review: {
        type: String,
        maxLength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent user from reviewing the same order twice
reviewSchema.index({ order: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
