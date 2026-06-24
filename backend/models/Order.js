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
        enum: ['COD', 'Online', 'Split'],
        default: 'Online'
    },
    isGroupOrder: { type: Boolean, default: false },
    splitPayments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: { type: Number },
        status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
    }],
    optOutCutlery: { type: Boolean, default: false },
    prepVideoUrl: { type: String },
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
        heading: { type: Number, default: 0 },  // compass degrees 0-360
        speed: { type: Number, default: 0 },    // m/s from GPS
        lastUpdated: { type: Date }
    },
    // Coordinates for map pins (set at order creation or first tracking call)
    restaurantCoords: {
        lat: { type: Number },
        lng: { type: Number }
    },
    deliveryCoords: {
        lat: { type: Number },
        lng: { type: Number }
    },
    estimatedDeliveryTime: { type: Date },
    deliveryStartTime: { type: Date },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    routePolyline: { type: String }, // For real-time map routing
    batchId: { type: String }, // For AI-based order batching
    surgeMultiplier: { type: Number, default: 1 },
    earningsEstimation: {
        basePay: { type: Number, default: 40 },
        distancePay: { type: Number, default: 0 },
        surgePay: { type: Number, default: 0 },
        incentivePay: { type: Number, default: 0 }
    },
    proofOfDelivery: {
        photoUrl: { type: String },
        signatureUrl: { type: String },
        otp: { type: String },
        verified: { type: Boolean, default: false }
    },
    geofencing: {
        arrivedAtShop: { type: Date },
        deliveredAtCustomer: { type: Date }
    },
    zone: { type: String }, // Operational zone name
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
