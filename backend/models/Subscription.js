const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planType: {
        type: String,
        enum: ['Prime', 'Tiffin', 'Corporate'],
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Cancelled'],
        default: 'Active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    // For Tiffin Services
    mealPlan: {
        frequency: { type: String, enum: ['Daily', 'Weekly', 'Monthly'] },
        mealsPerDay: { type: Number, default: 1 },
        preference: { type: String, enum: ['Veg', 'Non-Veg', 'Jain'] },
        deliverySlot: { type: String } // e.g. "Lunch (12PM - 2PM)"
    },
    // For Corporate
    corporateDetails: {
        companyName: { type: String },
        employeeCount: { type: Number },
        gstNumber: { type: String }
    },
    paymentId: { type: String },
    amountPaid: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
