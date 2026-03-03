const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    isLocal: { type: Boolean, default: false }, // "Support Local" flag
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    adminCommission: { type: Number, default: 10 }, // Percentage
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hygienePhotos: [{
        url: { type: String },
        timestamp: { type: Date, default: Date.now },
        isVerified: { type: Boolean, default: false }
    }],
    lastHygieneAudit: { type: Date },
    isVirtualBrand: { type: Boolean, default: false },
    parentKitchen: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    isFestivalPopup: { type: Boolean, default: false },
    festivalMeta: {
        festivalName: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true }
    },
    gstin: { type: String },
    fssai: { type: String },
    timing: {
        open: { type: String, default: '09:00 AM' },
        close: { type: String, default: '10:00 PM' }
    },
    minOrderValue: { type: Number, default: 0 },
    settings: {
        acceptsCOD: { type: Boolean, default: true },
        acceptsOnline: { type: Boolean, default: true },
        isOpen: { type: Boolean, default: true }
    },
    logo: { type: String }, // Shop logo URL
    banner: { type: String }, // Shop banner URL
    story: { type: String }, // Vendor bio/story
    specialTags: [{ type: String }], // e.g. "Festival Special", "Diwali Sweets"
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    costForTwo: { type: Number, default: 300 }
}, { timestamps: true });

// Performance Indexes
shopSchema.index({ slug: 1 });
shopSchema.index({ location: '2dsphere' }); // Geospatial index
shopSchema.index({ owner: 1 });
shopSchema.index({ isLocal: 1, isFeatured: 1 }); // For filtering

module.exports = mongoose.model('Shop', shopSchema);
