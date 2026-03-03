const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    coordinates: {
        type: { type: String, enum: ['Polygon'], default: 'Polygon' },
        coordinates: { type: [[[Number]]], required: true } // GeoJSON Polygon
    },
    activePartners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentSurge: { type: Number, default: 1 },
    demandLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Low'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

zoneSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
