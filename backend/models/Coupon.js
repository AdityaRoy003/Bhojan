const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please enter a coupon code'],
        unique: true,
        uppercase: true,
        trim: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    discountType: {
        type: String,
        enum: ['Percentage', 'Flat'],
        default: 'Percentage'
    },
    value: {
        type: Number,
        required: [true, 'Please enter discount value']
    },
    maxDiscount: {
        type: Number,
        default: 0 // 0 means no limit
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    validUntil: {
        type: Date,
        required: [true, 'Please select expiry date']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
