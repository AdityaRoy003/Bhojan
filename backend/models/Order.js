const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    items: [
        {
            item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
            name: { type: String, required: true }, // Store snapshot
            price: { type: Number, required: true }, // Store snapshot
            quantity: { type: Number, required: true, default: 1 },
            note: { type: String }
        }
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Online'],
        default: 'Online'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    instructions: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    orderStatus: {
        type: String,
        enum: ['Placed', 'Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'],
        default: 'Placed'
    },
    deliveryAddress: { type: String, required: true },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponDiscount: { type: Number, default: 0 },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryPartnerLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date }
    },
    estimatedDeliveryTime: { type: Date },
    deliveryStartTime: { type: Date },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    routePolyline: { type: String }, // For real-time map routing
    statusHistory: [{
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
}, { timestamps: true });

// Performance Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ shop: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 }); // For sorting by recent

module.exports = mongoose.model('Order', orderSchema);
