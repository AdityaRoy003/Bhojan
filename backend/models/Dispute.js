const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['Payment Issue', 'Cancellation Conflict', 'Customer Behavior', 'Technical Glitch', 'Other'],
        required: true
    },
    description: { type: String, required: true },
    evidence: [{ type: String }], // URLs to images/docs
    status: {
        type: String,
        enum: ['Pending', 'In-Review', 'Resolved', 'Rejected'],
        default: 'Pending'
    },
    resolutionNotes: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
