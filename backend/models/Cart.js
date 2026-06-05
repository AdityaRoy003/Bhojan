const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    partyId: { type: String, required: true, unique: true }, // Unique link ID for the group cart
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    participants: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            status: { type: String, enum: ['Browsing', 'Ready', 'Paid'], default: 'Browsing' }
        }
    ],
    items: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
            addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, default: 1 },
            note: { type: String }
        }
    ],
    status: {
        type: String,
        enum: ['Active', 'Locked', 'Completed', 'Cancelled'],
        default: 'Active' // Active means open for adding items, Locked means checking out
    }
}, { timestamps: true });

cartSchema.index({ hostId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
