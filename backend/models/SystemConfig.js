const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    deliveryCharges: { type: Number, default: 40 },
    taxPercentage: { type: Number, default: 18 },
    minOrderValue: { type: Number, default: 100 },
    maintenanceMode: { type: Boolean, default: false },
    globalBanner: { type: String, default: '' },
    surgePricing: { type: Boolean, default: false },
    surgeMultiplier: { type: Number, default: 1.5 },
    platformFee: { type: Number, default: 5 },
    referralBonus: { type: Number, default: 500 },
    featureFlags: {
        type: Map,
        of: Boolean,
        default: {
            liveTracking: true,
            referralSystem: true,
            loyaltyRewards: true,
            aiRecommendations: false
        }
    },
    categories: {
        type: [String],
        default: ['Snacks', 'Main Course', 'Dessert', 'Pizza', 'Burger', 'Sandwich', 'South Indian', 'Chinese', 'Fast Food']
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
