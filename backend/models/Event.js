const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    festivalTag: { type: String, default: '' }, // e.g. 'Holi', 'Chhath', 'Sonepur Mela'
    location: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    featuredShops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
