const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    conditionType: {
        type: String,
        enum: ['cuisine_variety', 'order_count', 'spend_amount', 'review_count', 'referral_count'],
        required: true
    },
    targetValue: { type: Number, required: true },
    rewardPoints: { type: Number, default: 0 },
    rewardBadge: { type: String, default: '' },
    rewardCouponDiscount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Quest', questSchema);
